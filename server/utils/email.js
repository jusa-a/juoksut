import process from 'node:process'

const tokenUrl = 'https://oauth2.googleapis.com/token'
const sendUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'

function base64(value) {
  const bytes = new TextEncoder().encode(value)
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
}

function base64Url(value) {
  return base64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function header(name, value) {
  // A newline would start a new header, so strip CR and LF from every value.
  return `${name}: ${value.replace(/[\r\n]/g, '')}`
}

function message({ from, to, replyTo, subject, text }) {
  const headers = [
    header('From', from),
    header('To', to),
    ...(replyTo ? [header('Reply-To', replyTo)] : []),
    `Subject: =?UTF-8?B?${base64(subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ]
  const body = base64(text).match(/.{1,76}/g) || []
  return `${headers.join('\r\n')}\r\n\r\n${body.join('\r\n')}`
}

export async function sendEmail({ to, subject, text }) {
  const {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
    GOOGLE_REFRESH_TOKEN: refreshToken,
    EMAIL_FROM: from,
    EMAIL_REPLY_TO: replyTo,
  } = process.env

  if (!clientId || !clientSecret || !refreshToken || !from) {
    // Log no recipient or message content.
    console.warn('email not configured')
    return { sent: false }
  }

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  const token = await tokenResponse.json().catch(() => null)
  if (!tokenResponse.ok || !token?.access_token)
    throw new Error(`Gmail token exchange failed: HTTP ${tokenResponse.status}`)

  const sendResponse = await fetch(sendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64Url(message({ from, to, replyTo, subject, text })) }),
  })
  if (!sendResponse.ok)
    throw new Error(`Gmail send failed: HTTP ${sendResponse.status}`)

  return { sent: true }
}
