import type { SafeAppsName, SafeAppsTag } from '@/config/constants'
import useChainId from '@/hooks/useChainId'
import { Errors, logError } from '@/services/exceptions'
import type { SafeAppsResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { getSafeApps } from '@safe-global/safe-gateway-typescript-sdk'
import { useEffect, useMemo } from 'react'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useAsync from '@safe-global/utils/hooks/useAsync'

// To avoid multiple simultaneous requests (e.g. the Dashboard and the SAFE header widget),
// cache the request promise for 100ms
let cache: Record<string, Promise<SafeAppsResponse> | undefined> = {}
const cachedGetSafeApps = (chainId: string): ReturnType<typeof getSafeApps> | undefined => {
  if (!cache[chainId]) {
    cache[chainId] = getSafeApps(chainId, { client_url: window.location.origin })

    // Clear the cache the promise resolves with a small delay
    cache[chainId]
      ?.catch(() => null)
      .then(() => {
        setTimeout(() => (cache[chainId] = undefined), 100)
      })
  }

  return cache[chainId]
}

type UseRemoteSafeAppsProps =
  | { tag: SafeAppsTag; name?: never }
  | { name: SafeAppsName; tag?: never }
  | { name?: never; tag?: never }

const useRemoteSafeApps = ({ tag, name }: UseRemoteSafeAppsProps = {}): AsyncResult<SafeAppsResponse> => {
  const chainId = useChainId()

  const [remoteApps, error, loading] = useAsync<SafeAppsResponse>(() => {
    if (!chainId) return
    return cachedGetSafeApps(chainId)
  }, [chainId])

  useEffect(() => {
    if (error) {
      logError(Errors._902, error.message)
    }
  }, [error])

  const apps = useMemo(() => {
    if (!remoteApps) return remoteApps
    if (tag) {
      return remoteApps.filter((app) => app.tags.includes(tag))
    }
    if (name) {
      return remoteApps.filter((app) => app.name === name)
    }
    return remoteApps
  }, [remoteApps, tag, name])

  const sortedApps = useMemo(() => {
    return apps?.sort((a, b) => a.name.localeCompare(b.name))
  }, [apps])

  return [sortedApps, error, loading]
}

export { useRemoteSafeApps }
