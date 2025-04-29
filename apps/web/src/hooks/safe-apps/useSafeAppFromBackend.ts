import { useEffect } from 'react'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import { getSafeApps } from '@safe-global/safe-gateway-typescript-sdk'
import { Errors, logError } from '@/services/exceptions'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { trimTrailingSlash } from '@/utils/url'

const useSafeAppFromBackend = (url: string, chainId: string): AsyncResult<SafeAppData> => {
  const [backendApp, error, loading] = useAsync(async () => {
    if (!chainId) return

    // We do not have a single standard for storing URLs, it may be stored with or without a trailing slash.
    // But for the request it has to be an exact match.
    const retryUrl = url.endsWith('/') ? trimTrailingSlash(url) : `${url}/`
    let response = await getSafeApps(chainId, { url })
    if (!response[0]) {
      response = await getSafeApps(chainId, { url: retryUrl })
    }

    return response?.[0]
  }, [chainId, url])

  useEffect(() => {
    if (error) {
      logError(Errors._900, error.message)
    }
  }, [error])

  return [backendApp, error, loading]
}

export { useSafeAppFromBackend }
