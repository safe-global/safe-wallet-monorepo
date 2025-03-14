const MAX_ORIGIN_LENGTH = 200

// Simply strip out any HTML tags from the input in addition to backend sanitization
function sanitizeInput(input: string): string {
  return input.replace(/<\/?[^>]+(>|$)/g, '')
}

export function encodeTxNote(note: string, origin = ''): string {
  note = sanitizeInput(note)
  let originalOrigin = {}

  if (origin) {
    try {
      originalOrigin = JSON.parse(origin)
    } catch {
      // Ignore, invalid JSON
    }
  }

  let result = JSON.stringify({
    ...originalOrigin,
    note,
  })

  if (result.length > MAX_ORIGIN_LENGTH) {
    result = JSON.stringify({
      ...originalOrigin,
      note: note.slice(0, MAX_ORIGIN_LENGTH - origin.length),
    })
  }

  return result
}
