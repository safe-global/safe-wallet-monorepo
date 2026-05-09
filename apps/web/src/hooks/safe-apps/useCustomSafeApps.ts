import { useState, useEffect, useCallback } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import local from '@/services/local-storage/local'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import useChainId from '@/hooks/useChainId'

type ReturnType = {
  customSafeApps: SafeAppData[]
  loading: boolean
  updateCustomSafeApps: (newCustomSafeApps: SafeAppData[]) => void
}

const CUSTOM_SAFE_APPS_STORAGE_KEY = 'customSafeApps'

const getChainSpecificSafeAppsStorageKey = (chainId: string) => `${CUSTOM_SAFE_APPS_STORAGE_KEY}-${chainId}`

type StoredCustomSafeApp = { url: string }

/*
  This hook is used to manage the list of custom safe apps.
  What it does:
  1. Loads a list of custom safe apps from local storage
  2. Does some backward compatibility checks (supported app networks, etc)
  3. Tries to fetch the app info (manifest.json) from the app url
*/
const useCustomSafeApps = (): ReturnType => {
  const [customSafeApps, setCustomSafeApps] = useState<SafeAppData[]>([])
  const [loading, setLoading] = useState(false)
  const chainId = useChainId()

  const updateCustomSafeApps = useCallback(
    (newCustomSafeApps: SafeAppData[]) => {
      setCustomSafeApps(newCustomSafeApps)

      const chainSpecificSafeAppsStorageKey = getChainSpecificSafeAppsStorageKey(chainId)
      local.setItem(
        chainSpecificSafeAppsStorageKey,
        newCustomSafeApps.map((app) => ({ url: app.url })),
      )
    },
    [chainId],
  )

  useEffect(() => {
    const loadCustomApps = async () => {
      setLoading(true)
      const chainSpecificSafeAppsStorageKey = getChainSpecificSafeAppsStorageKey(chainId)
      const storedApps = local.getItem<StoredCustomSafeApp[]>(chainSpecificSafeAppsStorageKey) || []
      const appManifests = await Promise.allSettled(storedApps.map((app) => fetchSafeAppFromManifest(app.url, chainId)))
      const resolvedApps = appManifests
        .filter((promiseResult) => promiseResult.status === 'fulfilled')
        .map((promiseResult) => (promiseResult as PromiseFulfilledResult<SafeAppData>).value)

      setCustomSafeApps(resolvedApps)
      setLoading(false)
    }

    loadCustomApps()
  }, [chainId])

  return { customSafeApps, loading, updateCustomSafeApps }
}

export { useCustomSafeApps }
