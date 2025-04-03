import { useEffect, useMemo } from 'react'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import { Errors, logError } from '@/services/exceptions'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import useAsync from '@/hooks/useAsync'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import type { SafeAppDataWithPermissions } from '@/components/safe-apps/types'
import { asError } from '@safe-global/utils/services/exceptions/utils'

type UseSafeAppFromManifestReturnType = {
  safeApp: SafeAppDataWithPermissions
  isLoading: boolean
}

const useSafeAppFromManifest = (
  appUrl: string,
  chainId: string,
  safeAppData?: SafeAppData,
): UseSafeAppFromManifestReturnType => {
  const [data, error, isLoading] = useAsync<SafeAppDataWithPermissions>(() => {
    if (appUrl && chainId && safeAppData) return fetchSafeAppFromManifest(appUrl, chainId)
  }, [appUrl, chainId, safeAppData])

  const emptyApp = useMemo(() => getEmptySafeApp(appUrl, safeAppData), [appUrl, safeAppData])

  useEffect(() => {
    if (!error) return
    logError(Errors._903, `${appUrl}, ${asError(error).message}`)
  }, [appUrl, error])

  return { safeApp: data || emptyApp, isLoading }
}

export { useSafeAppFromManifest }
