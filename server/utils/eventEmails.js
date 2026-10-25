// Signup emails are built only from the event page and its event row, so the
// same code serves every event page.

import { sendEmail } from './email'
import { getEventDetails } from './events'
import { unixToHelsinki } from './helsinkiTime'

const pink = '#FF639A'
const font = 'Helvetica, Arial, sans-serif'
const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }

function formatWhen(startsAt) {
  const day = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Helsinki',
  }).format(new Date(startsAt * 1000))
  return `${day} at ${unixToHelsinki(startsAt).time}`
}

function cancelLink(origin, token) {
  return `${origin}/signup/cancel?token=${token}`
}

function signOff() {
  return `Lightspeed regards,
Juoksut Crew`
}

function escapeHtml(value) {
  return value == null ? '' : String(value).replace(/[&<>"']/g, char => escapes[char])
}

// Mail apps turn bare URLs and addresses into blue links; make them pink ones
// first. Runs on already escaped text.
function linkify(html) {
  return html
    .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, url => `<a href="${url}" style="color:${pink}">${url}</a>`)
    .replace(/\b[\w.+-]+@[\w-]+(\.[\w-]+)+\b/g, address => `<a href="mailto:${address}" style="color:${pink}">${address}</a>`)
}

function paragraph(content, style = '') {
  return `<p style="margin:0 0 16px;font-family:${font};font-size:15px;line-height:22px;color:${pink};text-align:center;${style}">${content}</p>`
}

function eventBlock(page, event) {
  return `${paragraph(escapeHtml(page.title), 'font-size:17px;font-weight:600;margin:0 0 2px')}
${paragraph(escapeHtml(formatWhen(event.startsAt)), 'margin:0 0 2px')}
${paragraph(escapeHtml(event.venue), 'margin:0 0 28px')}`
}

function cancelButton(url, label) {
  const href = escapeHtml(url)
  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 28px">
<tr><td style="background:${pink};padding:13px 22px">
<a href="${href}" style="display:inline-block;font-family:${font};font-size:14px;font-weight:600;line-height:18px;letter-spacing:0.04em;text-transform:uppercase;color:#FFFFFF;text-decoration:none">${escapeHtml(label)}</a>
</td></tr>
</table>`
}

// Centred, no rules or boxes; the wordmark sits only in the footer, served from
// the public CDN (preview hosts are behind Access). Width and
// height are both set so no client rescales it out of proportion (600×104).
function layout({ heading, page, event, paragraphs, cancelUrl, cancelLabel }) {
  return `<!doctype html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:32px 16px;background:#FFFFFF;font-family:${font};color:${pink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;background:#FFFFFF;color:${pink}">
<tr><td align="center">
${paragraph(heading, 'font-size:24px;font-weight:600;line-height:30px;margin:0 0 24px')}
${eventBlock(page, event)}
${paragraphs.map(text => paragraph(linkify(escapeHtml(text)).replace(/\n/g, '<br>'))).join('\n')}
${cancelButton(cancelUrl, cancelLabel)}
${paragraph('Lightspeed regards,<br>Juoksut Crew', 'margin:0 0 40px')}
<img src="https://cdn.juoksut.run/email-wordmark.png" width="150" height="26" alt="JUOKSUT" style="display:block;width:150px;height:26px;margin:0 auto 10px;border:0">
${paragraph(`<a href="https://juoksut.run" style="color:${pink}">juoksut.run</a> · <a href="mailto:crew@juoksut.run" style="color:${pink}">crew@juoksut.run</a>`, 'font-size:12px;margin:0')}
</td></tr>
</table>
</body>
</html>`
}

export function confirmedEmail({ page, event, name, token, origin }) {
  const when = formatWhen(event.startsAt)
  return {
    subject: `${page.title}: you are confirmed for ${when}`,
    text: `Hi ${name},

You are confirmed for ${page.title} on ${when} at ${event.venue}.

${event.details}

Can't make it? Cancel here so someone on the waitlist gets your spot: ${cancelLink(origin, token)}.

${signOff()}`,
    html: layout({
      heading: 'You\'re in',
      page,
      event,
      paragraphs: [
        `Hi ${name},`,
        'Your spot is confirmed. See you there.',
        event.details,
      ],
      cancelUrl: cancelLink(origin, token),
      cancelLabel: 'Cancel my spot',
    }),
  }
}

export function waitlistEmail({ page, event, name, token, origin }) {
  const when = formatWhen(event.startsAt)
  return {
    subject: `${page.title}: you are on the waitlist for ${when}`,
    text: `Hi ${name},

You are on the waitlist for ${page.title} on ${when} at ${event.venue}. If a spot opens up before ${formatWhen(event.promoteUntil)}, you get it automatically and we email you.

Changed your mind? Cancel here: ${cancelLink(origin, token)}.

${signOff()}`,
    html: layout({
      heading: 'You\'re on the waitlist',
      page,
      event,
      paragraphs: [
        `Hi ${name},`,
        `If a spot opens up before ${formatWhen(event.promoteUntil)}, you get it automatically and we email you.`,
      ],
      cancelUrl: cancelLink(origin, token),
      cancelLabel: 'Leave the waitlist',
    }),
  }
}

export function promotedEmail({ page, event, name, token, origin }) {
  const when = formatWhen(event.startsAt)
  return {
    subject: `${page.title}: a spot opened for ${when}`,
    text: `Hi ${name},

A spot opened up, so you are now confirmed for ${page.title} on ${when} at ${event.venue}.

${event.details}

Can't make it? Cancel here so someone on the waitlist gets your spot: ${cancelLink(origin, token)}.

${signOff()}`,
    html: layout({
      heading: 'A spot opened up',
      page,
      event,
      paragraphs: [
        `Hi ${name},`,
        'A spot opened up, so you are now confirmed. See you there.',
        event.details,
      ],
      cancelUrl: cancelLink(origin, token),
      cancelLabel: 'Cancel my spot',
    }),
  }
}

// Crew actions that free or add places tell the promoted people. A mail
// failure is logged and never undoes the promotion.
export async function sendPromotedEmails(D1, promoted, origin) {
  if (!promoted.length)
    return
  const details = await getEventDetails(D1, promoted[0].event_id)
  if (!details)
    return

  for (const person of promoted) {
    try {
      await sendEmail({
        to: person.email,
        ...promotedEmail({ ...details, name: person.name, token: person.token, origin }),
      })
    }
    catch (error) {
      console.error('Failed to send event promotion email:', error.message)
    }
  }
}
