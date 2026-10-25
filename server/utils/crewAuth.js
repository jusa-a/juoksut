// Crew routes trust nothing but a verified Cloudflare Access token: the Access
// application is the login, this is the check, and it fails closed.

import process from 'node:process'
import { createError, getRequestHeader, getRequestURL } from 'h3'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const localHosts = ['localhost', '127.0.0.1', '::1']

// Cloudflare's cert endpoint is fetched once and its keys cached by jose for
// as long as the worker lives, so keep one set per team domain.
const keySets = new Map()

function forbidden() {
  return createError({ statusCode: 403, message: 'Crew access required' })
}

function remoteKeySet(teamDomain) {
  let jwks = keySets.get(teamDomain)
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`))
    keySets.set(teamDomain, jwks)
  }
  return jwks
}

// keyResolver is the test seam; production resolves keys from Cloudflare.
export async function verifyCrewToken(token, { teamDomain, audience, keyResolver }) {
  const { payload } = await jwtVerify(token, keyResolver || remoteKeySet(teamDomain), {
    issuer: teamDomain,
    audience,
    algorithms: ['RS256'],
    requiredClaims: ['exp', 'email'],
  })

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  if (!email.endsWith('@juoksut.run'))
    throw new Error('Crew access requires a @juoksut.run email')

  return { email }
}

function accessConfig() {
  const audience = (process.env.CF_ACCESS_AUD || '').trim()
  try {
    const teamDomain = new URL((process.env.CF_ACCESS_TEAM_DOMAIN || '').trim()).origin
    if (!teamDomain.startsWith('https://') || !audience)
      throw new Error('incomplete')
    return { teamDomain, audience }
  }
  catch {
    console.error('crew access not configured')
    return null
  }
}

export async function requireCrew(event) {
  const hostname = getRequestURL(event).hostname.replace(/^\[|\]$/g, '')

  // Local development has no Access in front of it. Only ever on loopback.
  if (process.env.CREW_LOCAL_DEV === '1' && localHosts.includes(hostname))
    return { email: 'local-dev@juoksut.run' }

  const config = accessConfig()
  if (!config)
    throw forbidden()

  const token = getRequestHeader(event, 'cf-access-jwt-assertion')
  if (!token)
    throw forbidden()

  try {
    return await verifyCrewToken(token, config)
  }
  catch {
    throw forbidden()
  }
}

export function crewDb(event) {
  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })
  return D1
}
