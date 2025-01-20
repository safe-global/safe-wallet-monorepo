const MAX_ORIGIN_LENGTH = 200

export function encodeTxNote(note: string, origin = ''): string {
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
