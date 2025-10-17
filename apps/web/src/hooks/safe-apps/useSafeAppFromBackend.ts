import { useEffect } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { useLazySafeAppsGetSafeAppsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Errors, logError } from '@/services/exceptions'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { trimTrailingSlash } from '@/utils/url'

const useSafeAppFromBackend = (url: string, chainId: string): AsyncResult<SafeAppData> => {
  const [trigger] = useLazySafeAppsGetSafeAppsV1Query()

  const [backendApp, error, loading] = useAsync(async () => {
    if (!chainId) return

    // We do not have a single standard for storing URLs, it may be stored with or without a trailing slash.
    // But for the request it has to be an exact match.
    const retryUrl = url.endsWith('/') ? trimTrailingSlash(url) : `${url}/`

    let result = await trigger({
      chainId,
      clientUrl: window.location.origin,
      url,
    }).unwrap()

    if (!result[0]) {
      result = await trigger({
        chainId,
        clientUrl: window.location.origin,
        url: retryUrl,
      }).unwrap()
    }

    return result?.[0]
  }, [chainId, url, trigger])

  useEffect(() => {
    if (error) {
      logError(Errors._900, error.message)
    }
  }, [error])

  return [backendApp, error, loading]
}

export { useSafeAppFromBackend }
