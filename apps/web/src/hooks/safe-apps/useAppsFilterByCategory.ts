import { useMemo } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

const useAppsFilterByCategory = (safeApps: SafeAppData[], selectedCategories: string[]): SafeAppData[] => {
  const filteredApps = useMemo(() => {
    const hasSelectedCategories = selectedCategories.length > 0

    if (hasSelectedCategories) {
      return safeApps.filter((safeApp) => selectedCategories.some((category) => safeApp.tags.includes(category)))
    }

    return safeApps
  }, [safeApps, selectedCategories])

  return filteredApps
}

export { useAppsFilterByCategory }
