import { useRouter } from 'next/router'
import { useCallback } from 'react'

export const WC_URI_SEARCH_PARAM = 'wc'

export function useWalletConnectSearchParamUri(): [string | null, (wcUri: string | null) => void] {
  const router = useRouter()
  const wcUri = (router.query[WC_URI_SEARCH_PARAM] || '').toString() || null

  const setWcUri = useCallback(
    (wcUri: string | null) => {
      const newQuery = { ...router.query }

      if (!wcUri) {
        delete newQuery[WC_URI_SEARCH_PARAM]
      } else {
        newQuery[WC_URI_SEARCH_PARAM] = wcUri
      }

      router.replace({
        pathname: router.pathname,
        query: newQuery,
      })
    },
    [router],
  )

  return [wcUri, setWcUri]
}
