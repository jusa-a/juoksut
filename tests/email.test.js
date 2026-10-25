import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendEmail } from '../server/utils/email'

const keys = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REFRESH_TOKEN',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
]

const originalEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]))

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = 'client-id'
  process.env.GOOGLE_CLIENT_SECRET = 'client-secret'
  process.env.GOOGLE_REFRESH_TOKEN = 'refresh-token'
  process.env.EMAIL_FROM = 'JUOKSUT <crew@juoksut.run>'
  process.env.EMAIL_REPLY_TO = 'crew@juoksut.run'
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

function tokenReply(accessToken = 'at-123') {
  return { ok: true, status: 200, json: async () => ({ access_token: accessToken }) }
}

function sendReply() {
  return { ok: true, status: 200, json: async () => ({ id: 'message-id' }) }
}

function fromBase64(value) {
  return new TextDecoder().decode(Uint8Array.from(atob(value), char => char.charCodeAt(0)))
}

function parseRaw(raw) {
  // base64url -> bytes -> UTF-8
  const message = fromBase64(raw.replace(/-/g, '+').replace(/_/g, '/'))
  const [head, body] = message.split('\r\n\r\n')
  return { message, headers: head.split('\r\n'), body }
}

async function sentRaw(fetchMock) {
  const body = JSON.parse(fetchMock.mock.calls[1][1].body)
  return parseRaw(body.raw)
}

describe('sendEmail', () => {
  it.each(keys.slice(0, 4))('sends nothing when %s is missing', async (key) => {
    delete process.env[key]
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendEmail({ to: 'runner@example.com', subject: 'Hi', text: 'Moi' })

    expect(result).toEqual({ sent: false })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith('email not configured')
  })

  it('exchanges the refresh token and sends the raw message', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(sendReply())
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendEmail({ to: 'runner@example.com', subject: 'Hi', text: 'Moi' })

    expect(result).toEqual({ sent: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const [tokenUrl, tokenOptions] = fetchMock.mock.calls[0]
    expect(tokenUrl).toBe('https://oauth2.googleapis.com/token')
    expect(tokenOptions.method).toBe('POST')
    expect(tokenOptions.body).toContain('grant_type=refresh_token')
    expect(tokenOptions.body).toContain('refresh_token=refresh-token')

    const [sendUrl, sendOptions] = fetchMock.mock.calls[1]
    expect(sendUrl).toBe('https://gmail.googleapis.com/gmail/v1/users/me/messages/send')
    expect(sendOptions.method).toBe('POST')
    expect(sendOptions.headers.Authorization).toBe('Bearer at-123')
  })

  it('builds a CRLF RFC 2822 message with encoded headers and body', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(sendReply())
    vi.stubGlobal('fetch', fetchMock)

    await sendEmail({
      to: 'runner@example.com',
      subject: 'Fastlane Friday: you are confirmed — Jyväskylä',
      text: 'Moi Äijä 🏃',
    })

    const { message, headers, body } = await sentRaw(fetchMock)

    expect(headers).toContain('From: JUOKSUT <crew@juoksut.run>')
    expect(headers).toContain('To: runner@example.com')
    expect(headers).toContain('Reply-To: crew@juoksut.run')
    expect(message.replace(/\r\n/g, '')).not.toContain('\n')

    const subjectLine = headers.find(line => line.startsWith('Subject: '))
    expect(subjectLine).toMatch(/^Subject: =\?UTF-8\?B\?.+\?=$/)
    expect(fromBase64(/^Subject: =\?UTF-8\?B\?(.+)\?=$/.exec(subjectLine)[1]))
      .toBe('Fastlane Friday: you are confirmed — Jyväskylä')

    expect(body.length).toBeGreaterThan(0)
    for (const line of body.split('\r\n'))
      expect(line.length).toBeLessThanOrEqual(76)
    expect(fromBase64(body.replace(/\r\n/g, ''))).toBe('Moi Äijä 🏃')
  })

  it('omits Reply-To when EMAIL_REPLY_TO is unset', async () => {
    delete process.env.EMAIL_REPLY_TO
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(sendReply())
    vi.stubGlobal('fetch', fetchMock)

    await sendEmail({ to: 'runner@example.com', subject: 'Hi', text: 'Moi' })

    const { message } = await sentRaw(fetchMock)
    expect(message).not.toMatch(/^Reply-To:/m)
  })

  it('cannot be made to add a header through the subject', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(sendReply())
    vi.stubGlobal('fetch', fetchMock)

    await sendEmail({
      to: 'runner@example.com',
      subject: 'Hello\r\nBcc: x@example.com',
      text: 'Moi',
    })

    const { message } = await sentRaw(fetchMock)
    expect(message).not.toMatch(/^Bcc:/m)
  })

  it('throws the token exchange status without the recipient', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    }))

    const error = await sendEmail({
      to: 'runner@example.com',
      subject: 'Hi',
      text: 'Moi',
    }).catch(caught => caught)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('400')
    expect(error.message).not.toContain('runner@example.com')
  })

  it('throws the send status without the recipient', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(tokenReply())
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) }))

    const error = await sendEmail({
      to: 'runner@example.com',
      subject: 'Hi',
      text: 'Moi',
    }).catch(caught => caught)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('500')
    expect(error.message).not.toContain('runner@example.com')
  })
})
