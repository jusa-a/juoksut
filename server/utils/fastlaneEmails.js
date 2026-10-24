const WARMUP_TIME = '16:30'
const TRACK_TIME = '17:00'
const TRACK_LENGTH = 'one hour'
const VENUE = 'Helsinki Olympic Stadium'
const SAFER_SPACE_URL = 'https://www.juoksut.run/join'

export function formatSessionDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Helsinki',
  }).format(new Date(`${date}T12:00:00Z`))
}

function cancelLink(origin, token) {
  return `${origin}/fastlane-friday/cancel?token=${token}`
}

function sessionDetails() {
  return `We start the sessions with a warmup and drills at ${WARMUP_TIME}. After that, we have the track session at ${TRACK_TIME} for ${TRACK_LENGTH}. Please bring clothes and shoes for both outdoor and indoor running. The stadium has locker rooms downstairs with showers where you can change and leave your stuff. The lockers have code locks so no need to bring your own lock. If it is your first time at the stadium, you can ask for help from our pacers, other participants, or the reception. After the session, you can join us for afters at a nearby pizzeria! Juoksut has Safer Space guidelines that everyone must follow: ${SAFER_SPACE_URL} .`
}

function signOff() {
  return `See you at the Stadium!
Lightspeed regards,
Juoksut Crew`
}

export function confirmedEmail({ name, date, token, origin }) {
  const when = formatSessionDate(date)
  return {
    subject: `Fastlane Friday: you are confirmed for ${when}`,
    text: `Hi ${name},

You are confirmed for Fastlane Friday on ${when} at ${VENUE}.

${sessionDetails()}

Can't make it? Cancel here so someone on the waitlist gets your spot: ${cancelLink(origin, token)}.

${signOff()}`,
  }
}

export function waitlistEmail({ name, date, token, origin }) {
  const when = formatSessionDate(date)
  return {
    subject: `Fastlane Friday: you are on the waitlist for ${when}`,
    text: `Hi ${name},

You are on the waitlist for Fastlane Friday on ${when}. We email you immediately if a spot opens up.

Changed your mind? Cancel here: ${cancelLink(origin, token)}.

${signOff()}`,
  }
}

export function promotedEmail({ name, date, token, origin }) {
  const when = formatSessionDate(date)
  return {
    subject: `Fastlane Friday: a spot opened for ${when}`,
    text: `Hi ${name},

A spot opened up, so you are now confirmed for Fastlane Friday on ${when} at ${VENUE}.

${sessionDetails()}

Can't make it? Cancel here so someone on the waitlist gets your spot: ${cancelLink(origin, token)}.

${signOff()}`,
  }
}
