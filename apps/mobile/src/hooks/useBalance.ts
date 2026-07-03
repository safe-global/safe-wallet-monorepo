import { useMemo } from 'react'
import type { Balance, Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useBalances } from './useBalances'

/** Balances covering the given tokens: the cached trusted set, widened to untrusted/dust only when a token is missing from it */
export const useTokenBalances = (tokenAddresses?: string[]): Balances | undefined => {
  const { balances: trustedBalances } = useBalances()
  const needsAllBalances =
    !!tokenAddresses?.length &&
    !!trustedBalances &&
    tokenAddresses.some(
      (address) => !trustedBalances.items.some((item) => sameAddress(item.tokenInfo.address, address)),
    )
  const { balances: allBalances } = useBalances(false, undefined, false, !needsAllBalances)

  return allBalances ?? trustedBalances
}

/** The Safe's balance entry for a token; undefined while loading or when the Safe does not hold it */
export const useBalance = (tokenAddress?: string): Balance | undefined => {
  const tokenAddresses = useMemo(() => (tokenAddress ? [tokenAddress] : undefined), [tokenAddress])
  const balances = useTokenBalances(tokenAddresses)

  return tokenAddress ? balances?.items.find((item) => sameAddress(item.tokenInfo.address, tokenAddress)) : undefined
}
