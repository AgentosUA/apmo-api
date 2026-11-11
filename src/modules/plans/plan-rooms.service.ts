import { Model, Types } from 'mongoose';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Subject } from 'rxjs';

import { Plan } from './plan.schema';
import { callsigns } from './lib';
import { PLAN_TITLE_MAX } from './plan.dto';

/** Sweet Markers marker as the web client keeps it. */
type PlanMarker = {
  id: string | number;
  /** SWT tuple: [text, [x, y], type, color, direction, size, '', []]. */
  data: unknown[];
};

type MarkerOp =
  | { type: 'add'; marker: PlanMarker }
  | { type: 'update'; marker: PlanMarker }
  | { type: 'remove'; id: string | number }
  | { type: 'set'; markers: PlanMarker[] };

type PlanPatch = {
  title?: string;
  /** Callsign → squad name. */
  slots?: Record<string, string>;
};

type Room = {
  planId: string;
  markers: PlanMarker[];
  /** Changes not written to the DB yet. */
  pending: {
    markers?: boolean;
    title?: string;
    slots?: Record<string, string>;
  };
  timer?: NodeJS.Timeout;
};

const MAX_MARKERS = 5000;
const MAX_MARKER_JSON = 4096;
const MAX_SLOT_LENGTH = 64;
/** At most one DB write per room per interval. */
const PERSIST_INTERVAL = 1000;

const isMarkerId = (value: unknown): value is string | number =>
  (typeof value === 'string' && value.length > 0 && value.length <= 64) ||
  (typeof value === 'number' && Number.isFinite(value));

const parseMarker = (value: unknown): PlanMarker | null => {
  if (!value || typeof value !== 'object') return null;

  const { id, data } = value as Record<string, unknown>;

  if (!isMarkerId(id) || !Array.isArray(data) || data.length > 16) return null;

  if (JSON.stringify(data).length > MAX_MARKER_JSON) return null;

  return { id, data };
};

const parseMarkers = (value: unknown): PlanMarker[] | null => {
  if (!Array.isArray(value) || value.length > MAX_MARKERS) return null;

  const markers = value.map(parseMarker);

  return markers.every(Boolean) ? (markers as PlanMarker[]) : null;
};

const parseStoredMarkers = (value?: string | null): PlanMarker[] => {
  try {
    return parseMarkers(JSON.parse(value || '[]')) ?? [];
  } catch {
    return [];
  }
};

/** Validates an op from a client. Returns `null` for anything malformed. */
const parseMarkerOp = (value: unknown): MarkerOp | null => {
  if (!value || typeof value !== 'object') return null;

  const op = value as Record<string, unknown>;

  switch (op.type) {
    case 'add':
    case 'update': {
      const marker = parseMarker(op.marker);

      return marker ? { type: op.type, marker } : null;
    }
    case 'remove':
      return isMarkerId(op.id) ? { type: 'remove', id: op.id } : null;
    case 'set': {
      const markers = parseMarkers(op.markers);

      return markers ? { type: 'set', markers } : null;
    }
    default:
      return null;
  }
};

const parsePlanPatch = (value: unknown): PlanPatch | null => {
  if (!value || typeof value !== 'object') return null;

  const body = value as Record<string, unknown>;
  const patch: PlanPatch = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') return null;

    const title = body.title.trim().slice(0, PLAN_TITLE_MAX);

    if (!title) return null;

    patch.title = title;
  }

  if (body.slots !== undefined) {
    if (!body.slots || typeof body.slots !== 'object') return null;

    const slots: Record<string, string> = {};

    for (const callsign of callsigns) {
      const squad = (body.slots as Record<string, unknown>)[callsign];

      slots[callsign] =
        typeof squad === 'string' ? squad.slice(0, MAX_SLOT_LENGTH) : '';
    }

    patch.slots = slots;
  }

  return Object.keys(patch).length ? patch : null;
};

/**
 * In-memory state of the plans that are open right now.
 *
 * Clients send small ops (add / move / delete a marker…); they are applied
 * here, broadcast by `PlanGateway` and written to Mongo at most once per
 * second. One API instance is assumed (rooms are not shared between processes).
 */
@Injectable()
export class PlanRoomsService implements OnApplicationShutdown {
  private readonly logger = new Logger(PlanRoomsService.name);

  private readonly rooms = new Map<string, Promise<Room>>();

  /** Rooms being written and closed — a new join waits for it. */
  private readonly releasing = new Map<string, Promise<void>>();

  /** The plan access was changed: re-check everybody in the room. */
  readonly accessChanged$ = new Subject<string>();

  /** Markers were replaced through REST: push them to the room. */
  readonly markersReplaced$ = new Subject<{
    planId: string;
    markers: PlanMarker[];
  }>();

  /** The plan was deleted: close the room. */
  readonly planDeleted$ = new Subject<string>();

  constructor(@InjectModel(Plan.name) private planModel: Model<Plan>) {}

  async acquire(planId: string): Promise<Room> {
    await this.releasing.get(planId);

    let room = this.rooms.get(planId);

    if (!room) {
      room = this.load(planId);
      this.rooms.set(planId, room);
      room.catch(() => this.rooms.delete(planId));
    }

    return room;
  }

  /** Current markers of an open plan (fresher than the DB), or `null`. */
  async peekMarkers(planId: string) {
    const room = this.rooms.get(planId);

    return room ? (await room).markers : null;
  }

  /** Applies a validated op. Returns the op to broadcast, or `null` if nothing changed. */
  async applyMarkerOp(
    planId: string,
    rawOp: unknown,
  ): Promise<MarkerOp | null> {
    const op = parseMarkerOp(rawOp);
    const room = this.rooms.get(planId);

    if (!op || !room) return null;

    const state = await room;

    switch (op.type) {
      case 'add': {
        const index = state.markers.findIndex((m) => m.id === op.marker.id);

        if (index !== -1) {
          state.markers[index] = op.marker;
        } else {
          if (state.markers.length >= MAX_MARKERS) return null;
          state.markers.push(op.marker);
        }
        break;
      }
      case 'update': {
        const index = state.markers.findIndex((m) => m.id === op.marker.id);

        // Somebody deleted it meanwhile.
        if (index === -1) return null;

        state.markers[index] = op.marker;
        break;
      }
      case 'remove': {
        const length = state.markers.length;

        state.markers = state.markers.filter((m) => m.id !== op.id);

        if (state.markers.length === length) return null;
        break;
      }
      case 'set':
        state.markers = op.markers;
        break;
    }

    state.pending.markers = true;
    this.schedulePersist(state);

    return op;
  }

  async applyPatch(
    planId: string,
    rawPatch: unknown,
  ): Promise<PlanPatch | null> {
    const patch = parsePlanPatch(rawPatch);
    const room = this.rooms.get(planId);

    if (!patch || !room) return null;

    const state = await room;

    if (patch.title !== undefined) state.pending.title = patch.title;
    if (patch.slots !== undefined) state.pending.slots = patch.slots;

    this.schedulePersist(state);

    return patch;
  }

  /** REST update of an open plan: the room takes the new markers. */
  async replaceMarkers(planId: string, planMarkers: string) {
    const room = this.rooms.get(planId);

    if (!room) return;

    const state = await room;
    const markers = parseStoredMarkers(planMarkers);

    state.markers = markers;
    // Already written by the REST handler.
    state.pending.markers = false;

    this.markersReplaced$.next({ planId, markers });
  }

  /** Writes pending changes and forgets the room (nobody is in it any more). */
  async release(planId: string) {
    const room = this.rooms.get(planId);

    if (!room) return;

    this.rooms.delete(planId);

    const done = room
      .then((state) => this.persist(state))
      .catch(() => undefined)
      .finally(() => this.releasing.delete(planId));

    this.releasing.set(planId, done);

    await done;
  }

  /** The plan is gone: drop its state without writing. */
  async drop(planId: string) {
    const room = this.rooms.get(planId);

    this.rooms.delete(planId);

    if (room) {
      const state = await room.catch(() => null);

      if (state?.timer) clearTimeout(state.timer);
    }

    this.planDeleted$.next(planId);
  }

  async onApplicationShutdown() {
    await Promise.all(
      [...this.rooms.keys()].map((planId) => this.release(planId)),
    );
  }

  private async load(planId: string): Promise<Room> {
    const plan = await this.planModel
      .findById(new Types.ObjectId(planId))
      .select('planMarkers')
      .lean();

    if (!plan) throw new Error('Plan not found');

    return {
      planId,
      markers: parseStoredMarkers(plan.planMarkers),
      pending: {},
    };
  }

  private schedulePersist(room: Room) {
    if (room.timer) return;

    room.timer = setTimeout(() => {
      room.timer = undefined;
      void this.persist(room);
    }, PERSIST_INTERVAL);
  }

  private async persist(room: Room) {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = undefined;
    }

    const { markers, title, slots } = room.pending;

    room.pending = {};

    const id = new Types.ObjectId(room.planId);

    try {
      if (markers || title !== undefined) {
        await this.planModel.updateOne(
          { _id: id },
          {
            $set: {
              ...(markers ? { planMarkers: JSON.stringify(room.markers) } : {}),
              ...(title !== undefined ? { title } : {}),
            },
          },
        );
      }

      if (slots) {
        // Slots belong to the mission; plans without a mission have none.
        await this.planModel.updateOne(
          { _id: id, mission: { $ne: null } },
          { $set: { 'mission.slots': slots } },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to save plan ${room.planId}`, error);

      // Retry with the next change / release.
      room.pending = {
        markers: markers || room.pending.markers,
        title: room.pending.title ?? title,
        slots: room.pending.slots ?? slots,
      };
    }
  }
}

export { parseMarkerOp, parsePlanPatch, parseStoredMarkers };

export type { PlanMarker, MarkerOp, PlanPatch };
