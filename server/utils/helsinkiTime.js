// Europe/Helsinki local time <-> Unix seconds, correct across DST changes.
// No date library: Intl gives the zone's offset at any instant.

const timeZone = 'Europe/Helsinki'

function partsOf(unix) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(unix * 1000))
  const value = type => parts.find(part => part.type === type).value
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
  }
}

function offsetAt(unix) {
  const { year, month, day, hour, minute } = partsOf(unix)
  return Date.UTC(+year, month - 1, +day, +hour, +minute) / 1000 - unix
}

export function helsinkiToUnix(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error(`Invalid Helsinki date/time: ${date} ${time}`)

  const guess = Date.parse(`${date}T${time}:00Z`) / 1000
  // The offset at the guess can differ from the offset at the real instant
  // (DST change), so apply it twice.
  const first = guess - offsetAt(guess)
  return guess - offsetAt(first)
}

export function unixToHelsinki(unix) {
  const { year, month, day, hour, minute } = partsOf(unix)
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` }
}

function addDays(date, days) {
  const unix = Date.parse(`${date}T00:00:00Z`) / 1000 + days * 86400
  return new Date(unix * 1000).toISOString().slice(0, 10)
}

function mondayOf(date) {
  const unix = Date.parse(`${date}T00:00:00Z`) / 1000
  // getUTCDay: Sunday is 0, so shift it to a Monday-first index.
  return addDays(date, -((new Date(unix * 1000).getUTCDay() + 6) % 7))
}

export function resolveEventTimes(page, date) {
  const monday = /^monday (\d{2}:\d{2})$/.exec(page.opens_rule)
  const daysBefore = /^days-before (\d+) (\d{2}:\d{2})$/.exec(page.opens_rule)
  const sameDay = /^same-day (\d{2}:\d{2})$/.exec(page.promote_rule)

  if (!monday && !daysBefore)
    throw new Error(`Invalid opens_rule: ${page.opens_rule}`)
  if (!sameDay)
    throw new Error(`Invalid promote_rule: ${page.promote_rule}`)

  return {
    startsAt: helsinkiToUnix(date, page.start_time),
    opensAt: monday
      ? helsinkiToUnix(mondayOf(date), monday[1])
      : helsinkiToUnix(addDays(date, -Number(daysBefore[1])), daysBefore[2]),
    promoteUntil: helsinkiToUnix(date, sameDay[1]),
  }
}
