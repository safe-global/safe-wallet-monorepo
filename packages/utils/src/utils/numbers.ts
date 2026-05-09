export const toDecimalString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'bigint' || typeof value === 'number') {
    return value.toString()
  }

  if (value && typeof value === 'object' && 'toString' in value) {
    try {
      return (value as { toString: () => string }).toString()
    } catch {
      return '0'
    }
  }

  return '0'
}
