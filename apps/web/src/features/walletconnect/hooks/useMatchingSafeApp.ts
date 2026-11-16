import { useMemo } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { useSafeAppsGetSafeAppsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import useChainId from '@/hooks/useChainId'
import { findMatchingSafeApp } from '../services/safeAppMatch'

type MatchingSafeApp = {
  safeApp: SafeAppData | undefined
  isLoading: boolean
}

/** The Safe App for a dApp URL on the current chain; nothing is fetched until there is a URL */
export const useMatchingSafeApp = (dappUrl?: string): MatchingSafeApp => {
  const chainId = useChainId()
  const clientUrl = typeof window !== 'undefined' ? window.location.origin : undefined

  // currentData, not data: it is undefined while a changed argument is fetched, so a stale list is never matched
  const { currentData: apps, isFetching } = useSafeAppsGetSafeAppsV1Query(
    { chainId, clientUrl },
    { skip: !dappUrl || !chainId || !clientUrl },
  )

  const safeApp = useMemo(() => (dappUrl ? findMatchingSafeApp(apps, dappUrl) : undefined), [apps, dappUrl])

  return { safeApp, isLoading: Boolean(dappUrl) && isFetching && !apps }
}
