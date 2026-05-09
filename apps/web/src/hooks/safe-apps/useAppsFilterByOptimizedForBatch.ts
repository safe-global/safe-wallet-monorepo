import { useMemo } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { isOptimizedForBatchTransactions } from '@/components/safe-apps/utils'

const useAppsFilterByOptimizedForBatch = (
  safeApps: SafeAppData[],
  optimizedWithBatchFilter: boolean,
): SafeAppData[] => {
  const filteredApps = useMemo(() => {
    if (optimizedWithBatchFilter) {
      return safeApps.filter((safeApp) => isOptimizedForBatchTransactions(safeApp))
    }

    return safeApps
  }, [safeApps, optimizedWithBatchFilter])

  return filteredApps
}

export { useAppsFilterByOptimizedForBatch }
