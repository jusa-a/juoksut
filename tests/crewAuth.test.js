import process from 'node:process'
import { createEvent } from 'h3'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { requireCrew, verifyCrewToken } from '../server/utils/crewAuth'

const teamDomain = 'https://juoksut.cloudflareaccess.com'
const audience = 'aud-1234'

const envKeys = ['CREW_LOCAL_DEV', 'CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD']
const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]))

let privateKey
let keyResolver

beforeAll(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  const publicJwk = await exportJWK(pair.publicKey)
  keyResolver = createLocalJWKSet({
    keys: [{ ...publicJwk, kid: 'test-key', alg: 'RS256', use: 'sig' }],
  })
})

afterEach(() => {
  for (const key of envKeys) {
    if (originalEnv[key] === undefined)
      delete process.env[key]
    else
      process.env[key] = originalEnv[key]
  }
})

afterAll(() => {
  for (const key of envKeys) {
    if (originalEnv[key] === undefined)
      delete process.env[key]
    else
      process.env[key] = originalEnv[key]
  }
})

function makeToken({
  email = 'Pacer@Juoksut.run',
  issuer = teamDomain,
  claimAudience = audience,
  expires = '1h',
  claims = {},
  omitEmail = false,
} = {}) {
  return new SignJWT({ ...(omitEmail ? {} : { email }), ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(issuer)
    .setAudience(claimAudience)
    .setExpirationTime(expires)
    .sign(privateKey)
}

function verify(token) {
  return verifyCrewToken(token, { teamDomain, audience, keyResolver })
}

function request(host, headers = {}) {
  return createEvent({ url: '/api/crew/pages', method: 'GET', headers: { host, ...headers } }, {})
}

describe('verifyCrewToken', () => {
  it('accepts a valid Access token and lowercases the email', async () => {
    expect(await verify(await makeToken())).toEqual({ email: 'pacer@juoksut.run' })
  })

  it('rejects a token for another audience', async () => {
    await expect(verify(await makeToken({ claimAudience: 'someone-else' }))).rejects.toThrow()
  })

  it('rejects a token from another issuer', async () => {
    await expect(verify(await makeToken({ issuer: 'https://evil.cloudflareaccess.com' }))).rejects.toThrow()
  })

  it('rejects an expired token', async () => {
    await expect(verify(await makeToken({ expires: '-1h' }))).rejects.toThrow()
  })

  it('rejects an HS256 token', async () => {
    const token = await new SignJWT({ email: 'pacer@juoksut.run' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(teamDomain)
      .setAudience(audience)
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('a'.repeat(32)))

    await expect(verify(token)).rejects.toThrow()
  })

  it('rejects an address outside juoksut.run', async () => {
    await expect(verify(await makeToken({ email: 'someone@gmail.com' }))).rejects.toThrow()
  })

  it('rejects a token without an email claim', async () => {
    await expect(verify(await makeToken({ omitEmail: true }))).rejects.toThrow()
  })
})

describe('requireCrew', () => {
  it('lets a local dev request through on loopback only', async () => {
    process.env.CREW_LOCAL_DEV = '1'

    expect(await requireCrew(request('127.0.0.1:8788'))).toEqual({ email: 'local-dev@juoksut.run' })
  })

  it('ignores the local bypass on a public host', async () => {
    process.env.CREW_LOCAL_DEV = '1'

    await expect(requireCrew(request('juoksut.run'))).rejects.toMatchObject({ statusCode: 403 })
  })

  it('fails closed when Access is not configured', async () => {
    delete process.env.CREW_LOCAL_DEV
    delete process.env.CF_ACCESS_TEAM_DOMAIN
    delete process.env.CF_ACCESS_AUD

    const denied = await requireCrew(request('juoksut.run', { 'cf-access-jwt-assertion': 'token' }))
      .catch(error => error)
    expect(denied.statusCode).toBe(403)
  })
})
