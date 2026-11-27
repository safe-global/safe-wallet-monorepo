import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '../types'

type KnownToken = { address: string; logoUri?: string | null }

/** The chain read has no ERC-20 logos, so each limit takes its token's logo from a token list of the Safe. */
export const withTokenLogos = (spendingLimits: SpendingLimitState[], knownTokens: KnownToken[]): SpendingLimitState[] =>
  spendingLimits.map((spendingLimit) => {
    if (spendingLimit.token.logoUri) return spendingLimit
    const logoUri = knownTokens.find((token) => sameAddress(token.address, spendingLimit.token.address))?.logoUri
    return logoUri ? { ...spendingLimit, token: { ...spendingLimit.token, logoUri } } : spendingLimit
  })
