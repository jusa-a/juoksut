// Page default rules as typed strings ("monday 12:00", "days-before 2 18:00",
// "same-day 12:00") <-> what the crew page's pickers edit. The patterns match
// resolveEventTimes in server/utils/helsinkiTime.js, which reads the strings.
export function parseOpensRule(rule) {
  const monday = /^monday (\d{2}:\d{2})$/.exec(rule || '')
  if (monday)
    return { kind: 'monday', days: 0, time: monday[1] }

  const daysBefore = /^days-before (\d+) (\d{2}:\d{2})$/.exec(rule || '')
  if (daysBefore)
    return { kind: 'days-before', days: Number(daysBefore[1]), time: daysBefore[2] }

  return null
}

export function composeOpensRule({ kind, days, time }) {
  return kind === 'monday' ? `monday ${time}` : `days-before ${days} ${time}`
}

export function parsePromoteRule(rule) {
  const match = /^same-day (\d{2}:\d{2})$/.exec(rule || '')
  return match ? match[1] : null
}

export function composePromoteRule(time) {
  return `same-day ${time}`
}
