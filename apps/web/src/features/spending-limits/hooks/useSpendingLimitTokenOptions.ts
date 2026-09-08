import { useMemo } from 'react'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { getNativeTokenDisplay } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useChain } from '@/hooks/useChains'
import { useTokenListSetting } from '@/hooks/loadables/useLoadBalances'
import { getPopularTokens } from '../popularTokens'
import { buildTokenOptions, type NativeCurrencyInfo, type TokenOption } from '../utils/tokenOptions'

export type TokenOptionsResult = {
  /** Held tokens first (fiat desc), then popular (symbol asc). */
  options: TokenOption[]
  /** Balances are in flight and nothing has arrived yet. Always false while the query is skipped. */
  isLoading: boolean
  isError: boolean
  refetch: () => void
  /** `${chainId}:${safeAddress}`; `''` when no Safe is selected. Changes exactly when the Safe changes. */
  identityKey: string
}

export const buildIdentityKey = (chainId: string, safeAddress: string): string =>
  safeAddress ? `${chainId}:${safeAddress}` : ''

/**
 * Token options for the spending-limit selector, scoped to the Safe that `useSafeInfo` / `useChainId`
 * resolve — the Space-level scope when one is mounted, the URL Safe otherwise.
 *
 * Held tokens always come from the Transaction Service balances endpoint (never the portfolio one):
 * it returns every token the Safe ever received, zero balances included, which AC C16 relies on.
 * Only the user's token-list ("trusted") setting applies; hidden-token and dust filters do not.
 */
const useSpendingLimitTokenOptions = (): TokenOptionsResult => {
  const chainId = useChainId()
  const { safe, safeAddress } = useSafeInfo()
  const chain = useChain(chainId)
  const currency = useAppSelector(selectCurrency)
  const trusted = useTokenListSetting()

  // The Transaction Service has no balances for an undeployed Safe; `trusted` is undefined until the
  // chain config resolves.
  const skip = !safeAddress || !safe.deployed || trusted === undefined

  const { currentData, isLoading, isFetching, isError, refetch } = useBalancesGetBalancesV1Query(
    { chainId, safeAddress, fiatCode: currency, trusted },
    { skip },
  )

  const native = useMemo<NativeCurrencyInfo | undefined>(() => {
    if (!chain || !getNativeTokenDisplay(chain).showNativeInBalances) return undefined
    const { symbol, name, decimals, logoUri } = chain.nativeCurrency
    return { symbol, name, decimals, logoUri }
  }, [chain])

  const options = useMemo(
    () => buildTokenOptions({ balances: currentData?.items, popular: getPopularTokens(chainId), native }),
    [currentData, chainId, native],
  )

  return {
    options,
    isLoading: !skip && currentData === undefined && (isLoading || isFetching),
    isError: !skip && isError,
    refetch,
    identityKey: buildIdentityKey(chainId, safeAddress),
  }
}

export default useSpendingLimitTokenOptions
