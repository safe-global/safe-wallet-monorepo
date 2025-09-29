/**
 * Safely converts unknown thrown values to Error objects without exposing sensitive data.
 * This is critical for wallet applications to prevent private keys or other sensitive
 * data from appearing in error messages or logs.
 */
export const asError = (thrown: unknown): Error => {
  if (thrown instanceof Error) {
    return thrown
  }

  let message: string

  if (typeof thrown === 'string') {
    message = thrown
  } else if (typeof thrown === 'number' || typeof thrown === 'boolean') {
    message = String(thrown)
  } else {
    // For objects, arrays, or other complex types, only log the type
    // Never serialize them as they could contain sensitive data
    message = `Non-Error object of type: ${typeof thrown}${Array.isArray(thrown) ? ' (array)' : ''}`
  }

  return new Error(message)
}
