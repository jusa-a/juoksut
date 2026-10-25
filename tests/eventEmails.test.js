import { describe, expect, it } from 'vitest'
import { confirmedEmail, promotedEmail, waitlistEmail } from '../server/utils/eventEmails'

const input = {
  page: { title: 'Test Event' },
  event: {
    startsAt: 1793975400,
    promoteUntil: 1793959200,
    venue: 'Test Hall',
    details: 'Meet at the north door.',
  },
  name: 'Ada',
  token: 'a'.repeat(32),
  origin: 'https://juoksut.run',
}

const cancelUrl = `https://juoksut.run/signup/cancel?token=${'a'.repeat(32)}`

describe('event email html', () => {
  it.each([
    ['You\'re in', 'Cancel my spot', confirmedEmail],
    ['You\'re on the waitlist', 'Leave the waitlist', waitlistEmail],
    ['A spot opened up', 'Cancel my spot', promotedEmail],
  ])('wraps the %s mail in the JUOKSUT layout', (heading, label, build) => {
    const { html } = build(input)

    expect(html).toContain(heading)
    expect(html).toContain('https://juoksut.run/img/email-wordmark.png')
    expect(html).toContain('max-width:560px')
    expect(html).toContain('Test Event')
    expect(html).toContain('Friday 6 November at 16:30')
    expect(html).toContain('Test Hall')
    expect(html).toContain(label)
    expect(html).toContain(cancelUrl)
    expect(html).toContain('Lightspeed regards,<br>Juoksut Crew')
    expect(html).toContain('JUOKSUT · <a href="https://juoksut.run"')
    expect(html).toContain('crew@juoksut.run')
    expect(html).not.toContain('<style')
  })

  it('escapes the name in html and leaves the text as it was', () => {
    const { text, html } = confirmedEmail({ ...input, name: '<b>Ä&</b>' })

    expect(text).toContain('Hi <b>Ä&</b>,')
    expect(html).toContain('Hi &lt;b&gt;Ä&amp;&lt;/b&gt;,')
    expect(html).not.toContain('<b>Ä&</b>')
  })

  it('escapes the details and keeps their line breaks', () => {
    const { html } = confirmedEmail({
      ...input,
      event: { ...input.event, details: 'Door 2\nAsk for <crew>' },
    })

    expect(html).toContain('Door 2<br>Ask for &lt;crew&gt;')
  })

  it('leaves the details out of the waitlist mail', () => {
    expect(waitlistEmail(input).html).not.toContain('Meet at the north door.')
  })
})
