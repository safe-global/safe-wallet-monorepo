// Array.isArray narrows `unknown` to `any[]`, this keeps the items `unknown`
export const isList = (value: unknown): value is unknown[] => Array.isArray(value)

export const formatDecodedValue = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return String(value)
}

const hasUnsafeNumber = (value: unknown): boolean => {
  if (isList(value)) return value.some(hasUnsafeNumber)
  return typeof value === 'number' && !Number.isSafeInteger(value)
}

// Some dApps send arrays as strings, e.g. '["hello","world"]'
export const parseDecodedValue = (value: unknown): unknown => {
  if (typeof value !== 'string') return value

  try {
    const parsed: unknown = JSON.parse(value)
    // JSON.parse drops digits beyond 2^53, so such arrays stay as the raw string
    return isList(parsed) && !hasUnsafeNumber(parsed) ? parsed : value
  } catch {
    return value
  }
}
