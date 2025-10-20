import type { SafeAppsName, SafeAppsTag } from '@/config/constants'
import useChainId from '@/hooks/useChainId'
import {
  type SafeAppsGetSafeAppsV1ApiResponse as SafeAppsResponse,
  useSafeAppsGetSafeAppsV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { useMemo } from 'react'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { asError } from '@safe-global/utils/services/exceptions/utils'

type UseRemoteSafeAppsProps =
  | { tag: SafeAppsTag; name?: never }
  | { name: SafeAppsName; tag?: never }
  | { name?: never; tag?: never }

const useRemoteSafeApps = ({ tag, name }: UseRemoteSafeAppsProps = {}): AsyncResult<SafeAppsResponse> => {
  const chainId = useChainId()
  const clientUrl = typeof window !== 'undefined' ? window.location.origin : undefined

  const {
    currentData: remoteApps,
    isLoading: loading,
    error,
  } = useSafeAppsGetSafeAppsV1Query(
    { chainId, clientUrl },
    {
      skip: !chainId || !clientUrl,
    },
  )

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
    return apps?.slice().sort((a, b) => a.name.localeCompare(b.name))
  }, [apps])

  return [sortedApps, asError(error), loading]
}

export { useRemoteSafeApps }
