import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { flattenSafeItems, type AllSafeItems } from '@/hooks/safes'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

/**
 * Overview loading/error state for a space's Safe accounts. The account rows themselves are rendered
 * by `SafeAccountsTable` (which fetches its own overviews); this hook exists only to drive the
 * surrounding aggregate-balance and setup widgets, which need to know when the overviews resolve.
 */
const useSpaceAccountsData = (safes: AllSafeItems) => {
  const currency = useAppSelector(selectCurrency)
  const wallet = useWallet()

  const flatSafes = useMemo(() => flattenSafeItems(safes), [safes])

  const { isFetching, error, refetch } = useGetMultipleSafeOverviewsQuery(
    flatSafes.length > 0 ? { safes: flatSafes, currency, walletAddress: wallet?.address } : skipToken,
  )

  return { isLoading: isFetching, error: error ? getRtkQueryErrorMessage(error) : undefined, refetch }
}

export default useSpaceAccountsData
