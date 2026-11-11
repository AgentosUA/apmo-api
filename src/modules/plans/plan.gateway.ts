import { randomInt } from 'crypto';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';

import { AuthGuard } from '../auth/auth.guard';
import { User } from '../users/user.schema';
import { PlanAccessService } from './plan-access.service';
import { PlanRoomsService, type PlanMarker } from './plan-rooms.service';
import type { PlanPermissions } from './plan-access';

/** A person looking at a plan, shown as an avatar in the plan header. */
type Presence = {
  /** Socket id — one per browser tab. */
  sessionId: string;
  userId: string | null;
  username: string;
  avatar: string | null;
  isGuest: boolean;
};

type SocketData = {
  ready?: Promise<void>;
  presence?: Presence;
  userId?: string | null;
  planId?: string | null;
  permissions?: PlanPermissions;
};

type PlanSocket = Socket<any, any, any, SocketData>;

type Ack<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** "Rookie#123456" — the web app picks the name from `random-names.ts`. */
const GUEST_NAME = /^[\p{L}\p{N} _.'-]{1,24}#\d{6}$/u;

const roomOf = (planId: string) => `plan:${planId}`;

const fallbackGuestName = () =>
  `Guest#${String(randomInt(0, 1_000_000)).padStart(6, '0')}`;

/**
 * Real-time plan editing.
 *
 * Client → server (with ack):
 * - `plan:join` `{ planId }` → `{ ok, sessionId, permissions, markers, presence }`
 * - `plan:leave`
 * - `markers:op` `{ op }` — add / update / remove / set (see `MarkerOp`)
 * - `plan:patch` `{ patch }` — `{ title?, slots? }`
 *
 * Server → client:
 * - `presence` `Presence[]`
 * - `markers:op` `{ op, by }`
 * - `plan:patched` `{ patch, by }`
 * - `plan:permissions` `PlanPermissions`
 * - `plan:access-revoked`, `plan:deleted`
 *
 * Auth: `auth.token` (JWT, optional) and `auth.guestName` in the handshake.
 */
@WebSocketGateway({
  namespace: '/plans',
  // Under the REST prefix, so one reverse-proxy rule (`/api`) serves both.
  path: '/api/socket.io',
  cors: { origin: '*' },
  maxHttpBufferSize: 5 * 1024 * 1024,
})
export class PlanGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PlanGateway.name);

  @WebSocketServer()
  server: Namespace;

  constructor(
    private readonly authGuard: AuthGuard,
    private readonly planAccess: PlanAccessService,
    private readonly rooms: PlanRoomsService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  afterInit() {
    this.rooms.accessChanged$.subscribe((planId) => {
      void this.refreshPermissions(planId);
    });

    this.rooms.markersReplaced$.subscribe(({ planId, markers }) => {
      this.broadcastMarkers(planId, markers);
    });

    this.rooms.planDeleted$.subscribe((planId) => {
      void this.closeRoom(planId);
    });
  }

  handleConnection(client: PlanSocket) {
    client.data.ready = this.identify(client).catch((error) => {
      this.logger.warn(`Failed to identify a socket: ${String(error)}`);
      client.data.userId = null;
      client.data.presence = this.guestPresence(client);
    });
  }

  async handleDisconnect(client: PlanSocket) {
    await this.leaveCurrent(client);
  }

  @SubscribeMessage('plan:join')
  async onJoin(
    @ConnectedSocket() client: PlanSocket,
    @MessageBody() body: { planId?: unknown },
  ): Promise<
    Ack<{
      sessionId: string;
      permissions: PlanPermissions;
      markers: PlanMarker[];
      presence: Presence[];
    }>
  > {
    await client.data.ready;

    const planId = body?.planId;

    if (typeof planId !== 'string' || !isValidObjectId(planId)) {
      return { ok: false, error: 'not_found' };
    }

    let permissions: PlanPermissions;

    try {
      const plan = await this.planAccess.findPlan(planId);
      permissions = await this.planAccess.permissionsFor(
        plan,
        client.data.userId,
      );
    } catch {
      return { ok: false, error: 'not_found' };
    }

    if (!permissions.canRead) {
      return { ok: false, error: 'forbidden' };
    }

    if (client.data.planId && client.data.planId !== planId) {
      await this.leaveCurrent(client);
    }

    const room = await this.rooms.acquire(planId);

    client.data.planId = planId;
    client.data.permissions = permissions;
    await client.join(roomOf(planId));

    const presence = await this.broadcastPresence(planId);

    return {
      ok: true,
      sessionId: client.id,
      permissions,
      markers: room.markers,
      presence,
    };
  }

  @SubscribeMessage('plan:leave')
  async onLeave(@ConnectedSocket() client: PlanSocket): Promise<Ack> {
    await this.leaveCurrent(client);

    return { ok: true };
  }

  @SubscribeMessage('markers:op')
  async onMarkerOp(
    @ConnectedSocket() client: PlanSocket,
    @MessageBody() body: { op?: unknown },
  ): Promise<Ack> {
    const planId = client.data.planId;

    if (!planId) return { ok: false, error: 'not_joined' };

    if (!client.data.permissions?.canEdit) {
      return { ok: false, error: 'forbidden' };
    }

    const op = await this.rooms.applyMarkerOp(planId, body?.op);

    if (op) {
      client.to(roomOf(planId)).emit('markers:op', { op, by: client.id });
    }

    return { ok: true };
  }

  @SubscribeMessage('plan:patch')
  async onPatch(
    @ConnectedSocket() client: PlanSocket,
    @MessageBody() body: { patch?: unknown },
  ): Promise<Ack> {
    const planId = client.data.planId;

    if (!planId) return { ok: false, error: 'not_joined' };

    const permissions = client.data.permissions;
    const patch = body?.patch as { title?: unknown } | undefined;

    // Renaming is the owner's call, other changes need edit access.
    if (
      !permissions?.canEdit ||
      (patch?.title !== undefined && !permissions.isOwner)
    ) {
      return { ok: false, error: 'forbidden' };
    }

    const applied = await this.rooms.applyPatch(planId, patch);

    if (!applied) return { ok: false, error: 'invalid' };

    client
      .to(roomOf(planId))
      .emit('plan:patched', { patch: applied, by: client.id });

    return { ok: true };
  }

  private async identify(client: PlanSocket) {
    const auth = (client.handshake.auth ?? {}) as Record<string, unknown>;
    const token = typeof auth.token === 'string' ? auth.token : '';

    let userId: string | null = null;

    if (token) {
      try {
        userId = (await this.authGuard.verifyAndGetUser(token))?.userId ?? null;
      } catch {
        userId = null;
      }
    }

    const user =
      userId && isValidObjectId(userId)
        ? await this.userModel
            .findById(new Types.ObjectId(userId))
            .select('username avatar')
            .lean()
        : null;

    if (!user) {
      client.data.userId = null;
      client.data.presence = this.guestPresence(client);

      return;
    }

    client.data.userId = String(user._id);
    client.data.presence = {
      sessionId: client.id,
      userId: String(user._id),
      username: user.username,
      avatar: user.avatar ?? null,
      isGuest: false,
    };
  }

  private guestPresence(client: PlanSocket): Presence {
    const name = (client.handshake.auth as Record<string, unknown> | undefined)
      ?.guestName;

    return {
      sessionId: client.id,
      userId: null,
      username:
        typeof name === 'string' && GUEST_NAME.test(name.trim())
          ? name.trim()
          : fallbackGuestName(),
      avatar: null,
      isGuest: true,
    };
  }

  private async leaveCurrent(client: PlanSocket) {
    const planId = client.data.planId;

    if (!planId) return;

    client.data.planId = null;
    client.data.permissions = undefined;

    await client.leave(roomOf(planId));
    await this.afterLeave(planId);
  }

  private async afterLeave(planId: string) {
    const presence = await this.broadcastPresence(planId);

    if (!presence.length) {
      await this.rooms.release(planId);
    }
  }

  private async getPresence(planId: string): Promise<Presence[]> {
    const sockets = await this.server.in(roomOf(planId)).fetchSockets();

    return sockets
      .map((socket) => (socket.data as SocketData).presence)
      .filter(Boolean);
  }

  private async broadcastPresence(planId: string) {
    const presence = await this.getPresence(planId);

    this.server.to(roomOf(planId)).emit('presence', presence);

    return presence;
  }

  private broadcastMarkers(planId: string, markers: PlanMarker[]) {
    this.server
      .to(roomOf(planId))
      .emit('markers:op', { op: { type: 'set', markers }, by: null });
  }

  /** Access changed: update everyone's rights, kick those who lost read access. */
  private async refreshPermissions(planId: string) {
    try {
      const plan = await this.planAccess.findPlan(planId);
      const sockets = await this.server.in(roomOf(planId)).fetchSockets();

      for (const socket of sockets) {
        const data = socket.data as SocketData;
        const permissions = await this.planAccess.permissionsFor(
          plan,
          data.userId,
        );

        if (!permissions.canRead) {
          data.planId = null;
          data.permissions = undefined;
          socket.emit('plan:access-revoked');
          socket.leave(roomOf(planId));
          continue;
        }

        data.permissions = permissions;
        socket.emit('plan:permissions', permissions);
      }

      await this.afterLeave(planId);
    } catch (error) {
      this.logger.warn(
        `Failed to refresh permissions of ${planId}: ${String(error)}`,
      );
    }
  }

  private async closeRoom(planId: string) {
    const sockets = await this.server.in(roomOf(planId)).fetchSockets();

    for (const socket of sockets) {
      const data = socket.data as SocketData;

      data.planId = null;
      data.permissions = undefined;
      socket.emit('plan:deleted');
      socket.leave(roomOf(planId));
    }
  }
}
