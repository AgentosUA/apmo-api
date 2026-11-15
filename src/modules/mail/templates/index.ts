import { HTML_LANG, type MailLanguage, strings } from './i18n';
import {
  button,
  codeBlock,
  details,
  escapeHtml,
  getFrontendUrl,
  layout,
  muted,
  paragraph,
  steps,
} from './layout';

type MailMessage = {
  subject: string;
  html: string;
  /** Plain-text alternative: better deliverability, readable everywhere. */
  text: string;
};

/** Strips the few tags used in the strings for the plain-text version. */
const plain = (html: string) => html.replace(/<[^>]+>/g, '');

/** `html: false` — for the plain-text version, where nothing is escaped. */
const greeting = (
  lang: MailLanguage,
  username?: string | null,
  { html = true }: { html?: boolean } = {},
) =>
  username
    ? strings[lang].greeting(html ? escapeHtml(username) : username)
    : strings[lang].greetingAnonymous;

/* -------------------------- temporary password -------------------------- */

const temporaryPasswordEmail = ({
  lang,
  username,
  password,
}: {
  lang: MailLanguage;
  username?: string | null;
  password: string;
}): MailMessage => {
  const t = strings[lang];
  const loginUrl = `${getFrontendUrl()}/auth/login`;

  return {
    subject: t.tempPassword.subject,
    html: layout({
      lang: HTML_LANG[lang],
      title: t.tempPassword.title,
      preheader: t.tempPassword.preheader,
      body: [
        paragraph(greeting(lang, username)),
        paragraph(t.tempPassword.intro),
        codeBlock(t.tempPassword.label, password),
        paragraph(t.tempPassword.afterLogin),
        button(t.tempPassword.action, loginUrl),
        muted(t.tempPassword.oldStillWorks),
        muted(t.ignore),
      ].join(''),
      footer: t.footer,
    }),
    text: [
      greeting(lang, username, { html: false }),
      '',
      plain(t.tempPassword.intro),
      '',
      `${t.tempPassword.label}: ${password}`,
      '',
      plain(t.tempPassword.afterLogin),
      `${t.tempPassword.action}: ${loginUrl}`,
      '',
      t.tempPassword.oldStillWorks,
      t.ignore,
    ].join('\n'),
  };
};

/* -------------------------------- welcome -------------------------------- */

const welcomeEmail = ({
  lang,
  username,
}: {
  lang: MailLanguage;
  username: string;
}): MailMessage => {
  const t = strings[lang];
  const createUrl = `${getFrontendUrl()}/plans/create`;

  return {
    subject: t.welcome.subject,
    html: layout({
      lang: HTML_LANG[lang],
      title: t.welcome.title,
      preheader: t.welcome.preheader,
      body: [
        paragraph(greeting(lang, username)),
        paragraph(t.welcome.intro),
        steps(t.welcome.steps),
        button(t.welcome.action, createUrl),
      ].join(''),
      footer: t.welcome.footer,
    }),
    text: [
      greeting(lang, username, { html: false }),
      '',
      t.welcome.intro,
      ...t.welcome.steps.map((step, index) => `${index + 1}. ${plain(step)}`),
      '',
      `${t.welcome.action}: ${createUrl}`,
    ].join('\n'),
  };
};

/* ---------------------------- account linked ---------------------------- */

const accountLinkedEmail = ({
  lang,
  username,
  provider,
  accountName,
  date = new Date(),
}: {
  lang: MailLanguage;
  username: string;
  /** Display name of the service, e.g. "Google". */
  provider: string;
  /** Name of the linked account on that service, if known. */
  accountName?: string | null;
  date?: Date;
}): MailMessage => {
  const t = strings[lang];
  const profileUrl = `${getFrontendUrl()}/profile?tab=accounts`;
  const formattedDate = `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const safeProvider = escapeHtml(provider);

  const rows: [string, string][] = [
    [t.linked.provider, provider],
    ...(accountName
      ? [[t.linked.account, accountName] as [string, string]]
      : []),
    [t.linked.date, formattedDate],
  ];

  return {
    subject: t.linked.subject(provider),
    html: layout({
      lang: HTML_LANG[lang],
      title: t.linked.title,
      preheader: t.linked.preheader(provider),
      body: [
        paragraph(greeting(lang, username)),
        paragraph(t.linked.intro(safeProvider)),
        details(rows),
        paragraph(t.linked.notYou),
        button(t.linked.action, profileUrl),
      ].join(''),
      footer: t.footer,
    }),
    text: [
      greeting(lang, username, { html: false }),
      '',
      plain(t.linked.intro(provider)),
      '',
      ...rows.map(([label, value]) => `${label}: ${value}`),
      '',
      plain(t.linked.notYou),
      `${t.linked.action}: ${profileUrl}`,
    ].join('\n'),
  };
};

export { accountLinkedEmail, temporaryPasswordEmail, welcomeEmail };
export { MAIL_LANGUAGES, resolveMailLanguage } from './i18n';
export type { MailLanguage } from './i18n';
export type { MailMessage };
