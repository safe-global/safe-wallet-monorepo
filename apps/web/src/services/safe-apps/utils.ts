/**
 * Check if the given origin is a SafePass app (community.safe.global)
 */
export const isSafePassApp = (origin: string): boolean => {
  return origin.includes('community.safe.global')
}
