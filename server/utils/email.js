import process from 'node:process'

const endpoint = 'https://api.cloudflare.com/client/v4/accounts'

export async function sendEmail({ to, subject, text, replyTo }) {
  const apiToken = process.env.EMAIL_API_TOKEN
  if (!apiToken) {
    // Log no recipient or message content.
    console.warn('email not configured')
    return { sent: false }
  }

  const response = await fetch(`${endpoint}/${process.env.CF_ACCOUNT_ID}/email/sending/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      from: process.env.EMAIL_FROM,
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    const messages = payload?.errors?.map(error => error.message).join(', ')
    throw new Error(`Cloudflare email failed: ${messages || `HTTP ${response.status}`}`)
  }

  return { sent: true, result: payload.result }
}
