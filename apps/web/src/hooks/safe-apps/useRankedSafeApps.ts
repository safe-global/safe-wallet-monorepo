import { useMemo } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { rankSafeApps } from '@/services/safe-apps/track-app-usage-count'

// number of ranked Safe Apps that we want to display
const NUMBER_OF_SAFE_APPS = 5

const useRankedSafeApps = (safeApps: SafeAppData[], pinnedSafeApps: SafeAppData[]): SafeAppData[] => {
  return useMemo(() => {
    if (!safeApps.length) return []

    // TODO: Remove assertion after migrating to new SDK
    const featuredApps = safeApps.filter((app) => (app as SafeAppData & { featured: boolean }).featured)
    const rankedPinnedApps = rankSafeApps(pinnedSafeApps)

    const allRankedApps = featuredApps.concat(rankedPinnedApps, pinnedSafeApps)

    // Use a Set to remove duplicates
    return [...new Set(allRankedApps)].slice(0, NUMBER_OF_SAFE_APPS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeApps])
}

export { useRankedSafeApps }
