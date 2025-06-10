import { skipToken } from '@reduxjs/toolkit/query'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useSelector } from 'react-redux'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectCurrency } from '@/src/store/settingsSlice'
import { POLLING_INTERVAL } from '@/src/config/constants'

export const useBalances = (poll = false, pollingInterval = POLLING_INTERVAL) => {
  const activeSafe = useSelector(selectActiveSafe)
  const currency = useSelector(selectCurrency)

  const { data, error, isLoading } = useBalancesGetBalancesV1Query(
    !activeSafe
      ? skipToken
      : {
          chainId: activeSafe.chainId,
          fiatCode: currency.toUpperCase(),
          safeAddress: activeSafe.address,
          excludeSpam: false,
          trusted: true,
        },
    {
      pollingInterval: poll ? pollingInterval : undefined,
    },
  )

  return {
    balances: data,
    loading: isLoading,
    error,
  }
}
