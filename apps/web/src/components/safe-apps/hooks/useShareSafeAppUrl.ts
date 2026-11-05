import { stringify } from 'querystring'
import { useEffect, useState } from 'react'

import { AppRoutes } from '@/config/routes'
import { useCurrentChain } from '@/hooks/useChains'

export const useShareSafeAppUrl = (appUrl: string): string => {
  const chain = useCurrentChain()
  const [shareSafeAppUrl, setShareSafeAppUrl] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const query = stringify({ appUrl, chain: chain?.shortName })
    setShareSafeAppUrl(`${window.location.origin}${AppRoutes.share.safeApp}?${query}`)
  }, [appUrl, chain?.shortName])

  return shareSafeAppUrl
}
