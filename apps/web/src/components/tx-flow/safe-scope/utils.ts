import type { SafeScopeKey, SafeScopeTarget } from './types'

/** Same shape as `SafeAccountSelector`'s `buildSafeAccountId`, so the selector's value can be passed straight through. */
export const buildSafeScopeKey = (chainId: string, safeAddress: string): SafeScopeKey => `${chainId}:${safeAddress}`

export const parseSafeScopeKey = (key: string): SafeScopeTarget | undefined => {
  const separator = key.indexOf(':')
  if (separator <= 0 || separator === key.length - 1) return undefined
  return { chainId: key.slice(0, separator), safeAddress: key.slice(separator + 1) }
}
