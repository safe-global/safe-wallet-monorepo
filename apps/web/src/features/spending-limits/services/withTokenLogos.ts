import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '../public/types'

/** The chain read has no ERC-20 logos, so each limit takes its token's logo from the Safe's balances. */
export const withTokenLogos = (spendingLimits: SpendingLimitState[], balanceItems: Balance[]): SpendingLimitState[] =>
  spendingLimits.map((spendingLimit) => {
    if (spendingLimit.token.logoUri) return spendingLimit
    const balance = balanceItems.find(({ tokenInfo }) => sameAddress(tokenInfo.address, spendingLimit.token.address))
    return balance
      ? { ...spendingLimit, token: { ...spendingLimit.token, logoUri: balance.tokenInfo.logoUri } }
      : spendingLimit
  })
