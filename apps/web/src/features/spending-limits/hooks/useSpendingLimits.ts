import { useEffect, useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import type { SpendingLimitState } from '../types'
import useChainId from '@/hooks/useChainId'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useBalances from '@/hooks/useBalances'
import { loadSpendingLimits } from '../services/spendingLimitLoader'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSpendingLimits, spendingLimitSlice } from '../store/spendingLimitsSlice'

/**
 * Hook for loading spending limits data.
 * Data is loaded once on app start via SpendingLimitsLoader component.
 * This hook reads from the store and handles the initial fetch.
 * Re-fetches when Safe changes (different safeAddress or chainId).
 */
export const useLoadSpendingLimits = () => {
  const dispatch = useAppDispatch()
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const { safeAddress, safe, safeLoaded } = useSafeInfo()
  const chainId = useChainId()
  const provider = useWeb3ReadOnly()
  const { balances } = useBalances()

  const tokenInfoFromBalances = useMemo(
    () => balances?.items.map(({ tokenInfo }) => tokenInfo) ?? [],
    [balances?.items],
  )

  const [data, error, loading] = useAsync<SpendingLimitState[] | undefined>(
    () => {
      if (!provider || !safeLoaded || !safe.modules || tokenInfoFromBalances.length === 0) return

      return loadSpendingLimits(provider, safe.modules, safeAddress, chainId, tokenInfoFromBalances)
    },
    // Need to check length of modules array to prevent new request every time Safe info polls
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, safeLoaded, safe.modules?.length, tokenInfoFromBalances, safeAddress, chainId, safe.txHistoryTag],
    true,
  )

  useEffect(() => {
    if (error) {
      logError(Errors._609, error.message)
    }
  }, [error])

  // Dispatch to store — mirrors the old useUpdateStore pattern.
  // During loading: data=undefined, so the reducer computes loaded=false.
  // On completion: data=[...results], so the reducer computes loaded=true.
  useEffect(() => {
    dispatch(
      spendingLimitSlice.actions.set({
        data,
        error: data ? undefined : error?.message,
        loading: loading && !data,
        loaded: false, // Ignored by reducer — it computes loaded from payload.data !== undefined
      }),
    )
  }, [dispatch, data, error, loading])

  return {
    spendingLimits,
    loading,
    error,
  }
}
