import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '../types'

export type KnownToken = { address: string; symbol: string; decimals: number; logoUri?: string | null }

/**
 * The chain read has no logos, and falls back to 18 decimals when a token's own calls fail. A token the
 * Safe already knows (from its balances or token options) wins, as it did when the loader got that list.
 */
export const withKnownTokenInfo = (
  spendingLimits: SpendingLimitState[],
  knownTokens: KnownToken[],
): SpendingLimitState[] =>
  spendingLimits.map((spendingLimit) => {
    const known = knownTokens.find((token) => sameAddress(token.address, spendingLimit.token.address))
    if (!known) return spendingLimit
    const { symbol, decimals, logoUri } = known
    return {
      ...spendingLimit,
      token: { ...spendingLimit.token, symbol, decimals, logoUri: logoUri || spendingLimit.token.logoUri },
    }
  })
