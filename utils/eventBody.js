// Plain-text event page body: a blank line starts a new paragraph, a single
// line break is kept (rendered with white-space: pre-line).
export function eventParagraphs(body) {
  return (body || '')
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
}
