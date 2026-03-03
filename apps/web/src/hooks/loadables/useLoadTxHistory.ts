import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useEffect } from 'react'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { Errors, logError } from '@/services/exceptions'
import useSafeInfo from '../useSafeInfo'
import useEffectiveSafeParams from '../useEffectiveSafeParams'
import { getTxHistory } from '@/services/transactions'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { useHasFeature } from '../useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

const useLoadTxHistory = (): AsyncResult<TransactionItemPage> => {
  const { safe, safeLoaded } = useSafeInfo()
  const { effectiveAddress, effectiveChainId } = useEffectiveSafeParams()
  const { txHistoryTag } = safe
  const { hideSuspiciousTransactions } = useAppSelector(selectSettings)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const hideUntrustedTxs = (hasDefaultTokenlist && hideSuspiciousTransactions) ?? true
  const hideImitationTxs = hideSuspiciousTransactions ?? true

  // Re-fetch when chainId, address, hideSuspiciousTransactions, or txHistoryTag changes
  const [data, error, loading] = useAsync<TransactionItemPage>(
    () => {
      if (!effectiveChainId || !effectiveAddress) return
      // For undeployed safes, return empty once safe info confirms not deployed
      if (safeLoaded && !safe.deployed) return Promise.resolve({ results: [] })

      return getTxHistory(effectiveChainId, effectiveAddress, hideUntrustedTxs, hideImitationTxs)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      effectiveChainId,
      effectiveAddress,
      hideSuspiciousTransactions,
      hasDefaultTokenlist,
      txHistoryTag,
      safeLoaded,
      safe.deployed,
    ],
    false,
  )

  // Log errors
  useEffect(() => {
    if (!error) return
    logError(Errors._602, error.message)
  }, [error])

  return [data, error, loading]
}

export default useLoadTxHistory
