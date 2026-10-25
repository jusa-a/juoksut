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

function paragraph(content, style = '') {
  return `<p style="margin:0 0 16px;font-family:${font};font-size:14px;line-height:20px;color:${pink};${style}">${content}</p>`
}

function rule() {
  return `<hr style="border:0;border-top:1px solid ${pink};margin:16px 0">`
}

function eventBlock(page, event) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${pink}">
<tr><td style="padding:16px">
${paragraph(escapeHtml(page.title), 'font-size:16px;font-weight:600;line-height:22px;margin:0 0 4px')}
${paragraph(escapeHtml(formatWhen(event.startsAt)), 'margin:0 0 4px')}
${paragraph(escapeHtml(event.venue), 'margin:0')}
</td></tr>
</table>`
}

// The same URL stays under the button for clients that strip or refuse it.
function cancelButton(url, label) {
  const href = escapeHtml(url)
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px">
<tr><td style="background:${pink};padding:12px 20px">
<a href="${href}" style="display:inline-block;font-family:${font};font-size:14px;font-weight:600;line-height:18px;letter-spacing:0.04em;text-transform:uppercase;color:#FFFFFF;text-decoration:none">${escapeHtml(label)}</a>
</td></tr>
</table>
${paragraph(`<a href="${href}" style="color:${pink}">${href}</a>`, 'font-size:12px')}`
}

function layout({ origin, heading, page, event, paragraphs, cancelUrl, cancelLabel }) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:24px 12px;background:#FFFFFF;font-family:${font};color:${pink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;color:${pink}">
<tr><td>
<img src="${escapeHtml(origin)}/img/email-wordmark.png" width="240" alt="JUOKSUT" style="display:block;max-width:100%;border:0">
${rule()}
${paragraph(heading, 'font-size:20px;font-weight:600;line-height:26px')}
${eventBlock(page, event)}
</td></tr>
<tr><td style="padding:16px 0 0">
${paragraphs.map(text => paragraph(escapeHtml(text).replace(/\n/g, '<br>'))).join('\n')}
${cancelButton(cancelUrl, cancelLabel)}
${paragraph('Lightspeed regards,<br>Juoksut Crew')}
${rule()}
${paragraph('JUOKSUT · <a href="https://juoksut.run" style="color:#FF639A">juoksut.run</a> · crew@juoksut.run', 'font-size:12px;margin:0')}
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
      origin,
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
      origin,
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
      origin,
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
