import { useMemo } from 'react'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useTokensGetTokensV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import { getNativeTokenDisplay } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useChain } from '@/hooks/useChains'
import { useTokenListSetting } from '@/hooks/loadables/useLoadBalances'
import { getPopularTokenAddresses } from '../popularTokens'
import { buildTokenOptions, toPopularToken, type NativeCurrencyInfo, type TokenOption } from '../utils/tokenOptions'

export type TokenOptionsResult = {
  /** Held tokens first (fiat desc), then popular (symbol asc). */
  options: TokenOption[]
  /** Balances are in flight and nothing has arrived yet. Always false while the query is skipped. */
  isLoading: boolean
  isError: boolean
  refetch: () => void
  /** Popular-token metadata is in flight and nothing has arrived yet. False for chains without a popular list. */
  isPopularLoading: boolean
  isPopularError: boolean
  refetchPopular: () => void
  /** `${chainId}:${safeAddress}`; `''` when no Safe is selected. Changes exactly when the Safe changes. */
  identityKey: string
}

export const buildIdentityKey = (chainId: string, safeAddress: string): string =>
  safeAddress ? `${chainId}:${safeAddress}` : ''

/**
 * Token options for the spending-limit selector, scoped to the Safe that `useSafeInfo` / `useChainId`
 * resolve — the Space-level scope once WA-3146's scope-aware `useSafeInfo`/`useChainId` land (#8646);
 * the URL Safe otherwise.
 *
 * Held tokens always come from the Transaction Service balances endpoint (never the portfolio one):
 * it returns every token the Safe ever received, zero balances included, which AC C16 relies on.
 * Only the user's token-list ("trusted") setting applies; hidden-token and dust filters do not.
 *
 * Popular tokens are a per-chain address list; their metadata comes from CGW's token endpoint so it
 * can never drift from what the assets page shows.
 */
const useSpendingLimitTokenOptions = (): TokenOptionsResult => {
  const chainId = useChainId()
  const { safe, safeAddress } = useSafeInfo()
  const chain = useChain(chainId)
  const currency = useAppSelector(selectCurrency)
  const trusted = useTokenListSetting()

  // `useChainId` can flip a render before `useSafeInfo` (Redux, updated in an effect) catches up
  // during navigation between Safes on different chains — see useLoadSafeInfo's `isStoredSafeValid`.
  // Treat the identity as valid only once both agree, so we never issue a cross-chain balances query.
  const identityMatchesChain = safe.chainId === chainId
  // The Transaction Service has no balances for an undeployed Safe; `trusted` is undefined until the
  // chain config resolves.
  const hasValidSafe = Boolean(safeAddress) && safe.deployed && identityMatchesChain
  const skip = !hasValidSafe || trusted === undefined

  const { currentData, isLoading, isFetching, isError, refetch } = useBalancesGetBalancesV1Query(
    { chainId, safeAddress, fiatCode: currency, trusted },
    { skip },
  )

  const popularAddresses = getPopularTokenAddresses(chainId)
  const hasPopular = popularAddresses.length > 0
  const {
    currentData: popularData,
    isLoading: popularIsLoading,
    isFetching: popularIsFetching,
    isError: popularIsError,
    refetch: refetchPopular,
  } = useTokensGetTokensV1Query({ chainId, addresses: popularAddresses.join(',') }, { skip: !hasPopular })

  const native = useMemo<NativeCurrencyInfo | undefined>(() => {
    if (!chain || !getNativeTokenDisplay(chain).showNativeInBalances) return undefined
    const { symbol, name, decimals, logoUri } = chain.nativeCurrency
    return { symbol, name, decimals, logoUri }
  }, [chain])

  const popular = useMemo(
    () => (popularData ?? []).filter((token) => token.type !== 'ERC721').map(toPopularToken),
    [popularData],
  )

  const options = useMemo(
    () => buildTokenOptions({ balances: currentData?.items, popular, native }),
    [currentData, popular, native],
  )

  return {
    options,
    // While `trusted` is still resolving for an otherwise-valid Safe, report loading rather than
    // letting the popular-only list flash before the held-token query even starts.
    isLoading: hasValidSafe && (trusted === undefined || (currentData === undefined && (isLoading || isFetching))),
    isError: !skip && isError,
    refetch,
    isPopularLoading: hasPopular && popularData === undefined && (popularIsLoading || popularIsFetching),
    isPopularError: hasPopular && popularIsError,
    refetchPopular,
    identityKey: identityMatchesChain ? buildIdentityKey(chainId, safeAddress) : '',
  }
}

export default useSpendingLimitTokenOptions
