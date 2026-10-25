import process from 'node:process'

const siteverifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Fail closed: a missing secret or token, a network error or a non-OK reply
// all mean "not a verified human".
export async function verifyTurnstile(token, ip, secret = process.env.TURNSTILE_SECRET_KEY) {
  if (!secret || !token)
    return false

  const body = new URLSearchParams({ secret, response: token })
  if (ip)
    body.set('remoteip', ip)

  try {
    const response = await fetch(siteverifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!response.ok)
      return false

    const payload = await response.json()
    return payload?.success === true
  }
  catch {
    return false
  }
}
