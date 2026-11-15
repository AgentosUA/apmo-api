/**
 * Email layout in the style of the site: black panels, the orange title bar
 * of the Arma 3 UI, uppercase labels. Table based with inline styles, so it
 * renders the same in Gmail, Outlook and Apple Mail; dark backgrounds are
 * kept in dark mode thanks to `color-scheme`.
 */

const COLORS = {
  page: '#050807',
  panel: '#0b100e',
  border: '#1f2724',
  orange: '#a16c14',
  orangeLight: '#c98a1e',
  text: '#e8e8e6',
  muted: '#9aa19e',
  faint: '#5e6662',
} as const;

const FONT =
  "Roboto, 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO =
  "'Roboto Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || 'https://arma-plan-maker.com').replace(
    /\/+$/,
    '',
  );

/* ------------------------------ blocks ------------------------------ */

const paragraph = (html: string) =>
  `<p style="margin:0 0 16px;font:400 15px/1.6 ${FONT};color:${COLORS.text};">${html}</p>`;

const muted = (html: string) =>
  `<p style="margin:0 0 12px;font:400 13px/1.6 ${FONT};color:${COLORS.muted};">${html}</p>`;

/** A big monospace value with a label, e.g. a temporary password. */
const codeBlock = (label: string, value: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr>
    <td style="padding:0 0 6px;font:500 11px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${COLORS.muted};">${escapeHtml(label)}</td>
  </tr>
  <tr>
    <td style="background:#000;border:1px solid ${COLORS.border};border-left:3px solid ${COLORS.orange};padding:18px 20px;font:600 20px/1.3 ${MONO};letter-spacing:.06em;color:#fff;word-break:break-all;">${escapeHtml(value)}</td>
  </tr>
</table>`;

const button = (label: string, href: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr>
    <td style="background:${COLORS.orange};">
      <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:12px 28px;font:500 13px/1 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:#fff;text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;

/** Key/value rows, e.g. account details in a security notice. */
const details = (rows: [string, string][]) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid ${COLORS.border};">
  ${rows
    .map(
      ([label, value], index) => `
  <tr>
    <td style="padding:10px 14px;${index ? `border-top:1px solid ${COLORS.border};` : ''}font:500 11px/1.4 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${COLORS.muted};width:40%;">${escapeHtml(label)}</td>
    <td style="padding:10px 14px;${index ? `border-top:1px solid ${COLORS.border};` : ''}font:400 14px/1.4 ${FONT};color:${COLORS.text};">${escapeHtml(value)}</td>
  </tr>`,
    )
    .join('')}
</table>`;

/** Numbered tips, e.g. "what you can do next". */
const steps = (items: string[]) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
  ${items
    .map(
      (item, index) => `
  <tr>
    <td valign="top" style="width:34px;padding:0 0 12px;">
      <div style="width:24px;height:24px;background:#000;border:1px solid ${COLORS.orange};font:600 12px/24px ${MONO};text-align:center;color:${COLORS.orangeLight};">${index + 1}</div>
    </td>
    <td valign="top" style="padding:3px 0 12px;font:400 14px/1.5 ${FONT};color:${COLORS.text};">${item}</td>
  </tr>`,
    )
    .join('')}
</table>`;

/* ------------------------------ layout ------------------------------ */

type LayoutOptions = {
  lang: string;
  /** Shown in the orange title bar. */
  title: string;
  /** Hidden preview text shown by mail clients next to the subject. */
  preheader: string;
  body: string;
  footer: string;
};

const layout = ({ lang, title, preheader, body, footer }: LayoutOptions) => {
  const site = getFrontendUrl();
  const host = site.replace(/^https?:\/\//, '');

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    a { color: ${COLORS.orangeLight}; }
    @media (max-width: 620px) {
      .container { width: 100% !important; }
      .px { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.page};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
          <!-- brand -->
          <tr>
            <td class="px" style="padding:0 4px 16px;">
              <a href="${escapeHtml(site)}" target="_blank" style="text-decoration:none;">
                <img src="${escapeHtml(site)}/a3-logo.png" width="28" height="28" alt="" style="display:inline-block;vertical-align:middle;border:0;" />
                <span style="display:inline-block;vertical-align:middle;margin-left:10px;font:600 13px/1 ${FONT};letter-spacing:.18em;text-transform:uppercase;color:#fff;">Arma Plan Maker</span>
              </a>
            </td>
          </tr>
          <!-- title bar -->
          <tr>
            <td class="px" style="background:${COLORS.orange};padding:8px 24px;font:500 13px/1.4 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:#fff;">${escapeHtml(title)}</td>
          </tr>
          <!-- content -->
          <tr>
            <td class="px" style="background:${COLORS.panel};border:1px solid ${COLORS.border};border-top:0;padding:32px 32px 16px;">
              ${body}
            </td>
          </tr>
          <!-- footer -->
          <tr>
            <td class="px" style="padding:20px 4px 0;font:400 12px/1.6 ${FONT};color:${COLORS.faint};">
              ${footer}<br />
              <a href="${escapeHtml(site)}" target="_blank" style="color:${COLORS.muted};text-decoration:none;">${escapeHtml(host)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export {
  button,
  codeBlock,
  details,
  escapeHtml,
  getFrontendUrl,
  layout,
  muted,
  paragraph,
  steps,
};
