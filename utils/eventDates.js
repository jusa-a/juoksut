// Event times in Helsinki, written the way the club writes them: "Fri", "6.11.", "17:00".
const weekdayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  timeZone: 'Europe/Helsinki',
})
const dateFormat = new Intl.DateTimeFormat('fi-FI', {
  day: 'numeric',
  month: 'numeric',
  timeZone: 'Europe/Helsinki',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Helsinki',
})

export const formatWeekday = unix => weekdayFormat.format(new Date(unix * 1000))
export const formatDate = unix => dateFormat.format(new Date(unix * 1000))
export const formatTime = unix => timeFormat.format(new Date(unix * 1000))
export const formatOpens = unix => `Opens ${formatWeekday(unix)} ${formatDate(unix)} ${formatTime(unix)}`
