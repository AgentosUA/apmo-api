import { Injectable, Logger } from '@nestjs/common';

import type { MailMessage } from './templates';

const RESEND_API_URL = 'https://api.resend.com/emails';

type SendOptions = {
  to: string;
  message: MailMessage;
  /** Resend de-duplicates requests with the same key for 24 hours. */
  idempotencyKey?: string;
};

/**
 * Sends emails through Resend (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Uses the REST API directly, so no SDK is needed. Without RESEND_API_KEY
 * sending is skipped (and logged), which keeps local development working.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  get isEnabled() {
    return Boolean(process.env.RESEND_API_KEY);
  }

  /** Throws when Resend rejects the email. */
  async send({ to, message, idempotencyKey }: SendOptions) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY is not set, "${message.subject}" to ${to} was not sent`,
      );
      return;
    }

    const from =
      process.env.MAIL_FROM || 'Arma Plan Maker <no-reply@arma-plan-maker.com>';
    const replyTo = process.env.MAIL_REPLY_TO;

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');

      throw new Error(`Resend responded ${response.status}: ${details}`);
    }
  }

  /** Fire-and-forget variant for non-critical emails (welcome, notices). */
  sendInBackground(options: SendOptions) {
    this.send(options).catch((error) =>
      this.logger.error(
        `Failed to send "${options.message.subject}" to ${options.to}`,
        error instanceof Error ? error.stack : String(error),
      ),
    );
  }
}
