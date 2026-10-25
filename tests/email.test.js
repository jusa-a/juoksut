import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendEmail } from '../server/utils/email'

const originalEnv = {
  EMAIL_API_TOKEN: process.env.EMAIL_API_TOKEN,
  EMAIL_FROM: process.env.EMAIL_FROM,
  CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID,
}

beforeEach(() => {
  process.env.EMAIL_API_TOKEN = 'test-token'
  process.env.EMAIL_FROM = 'crew@juoksut.run'
  process.env.CF_ACCOUNT_ID = 'account-id'
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined)
      delete process.env[key]
    else
      process.env[key] = value
  }
})

describe('sendEmail', () => {
  it('posts the message to the Cloudflare Email Sending API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        result: { delivered: 1, queued: 0, permanent_bounces: 0 },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendEmail({
      to: 'ada@example.com',
      subject: 'Hello',
      text: 'Body',
      replyTo: 'reply@example.com',
    })

    expect(result.sent).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/account-id/email/sending/send')
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toBe('Bearer test-token')
    expect(JSON.parse(options.body)).toEqual({
      to: 'ada@example.com',
      from: 'crew@juoksut.run',
      subject: 'Hello',
      text: 'Body',
      reply_to: 'reply@example.com',
    })
  })

  it('throws the Cloudflare error messages without leaking secrets', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        success: false,
        errors: [{ code: 429, message: 'rate limited' }],
      }),
    }))

    const error = await sendEmail({
      to: 'ada@example.com',
      subject: 'Hello',
      text: 'Body',
    }).catch(caught => caught)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('rate limited')
    expect(error.message).not.toContain('test-token')
    expect(error.message).not.toContain('ada@example.com')
  })

  it('warns once and sends nothing when the API token is unset', async () => {
    delete process.env.EMAIL_API_TOKEN
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendEmail({
      to: 'ada@example.com',
      subject: 'Hello',
      text: 'Body',
    })

    expect(result).toEqual({ sent: false })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith('email not configured')
  })
})
