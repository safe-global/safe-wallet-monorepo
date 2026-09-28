import { useMemo } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { useSafeAppsGetSafeAppsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import useChainId from '@/hooks/useChainId'
import { findMatchingSafeApp } from '../services/safeAppMatch'

type MatchingSafeApp = {
  safeApp: SafeAppData | undefined
  isLoading: boolean
}

/**
 * Find the Safe App matching a dApp's URL on the current chain.
 *
 * The query is skipped until a URL is passed, so nothing is fetched unless there is a live
 * WalletConnect session proposal. The endpoint is per-chain, so results are already filtered
 * to apps available on the current chain and allowed for this host.
 */
export const useMatchingSafeApp = (dappUrl?: string): MatchingSafeApp => {
  const chainId = useChainId()
  const clientUrl = typeof window !== 'undefined' ? window.location.origin : undefined

  // isFetching rather than isLoading: currentData is undefined while a changed argument is
  // refetched, and treating that as loaded would report "no Safe App" prematurely
  const { currentData: apps, isFetching } = useSafeAppsGetSafeAppsV1Query(
    { chainId, clientUrl },
    { skip: !dappUrl || !chainId || !clientUrl },
  )

  const safeApp = useMemo(() => (dappUrl ? findMatchingSafeApp(apps, dappUrl) : undefined), [apps, dappUrl])

  return { safeApp, isLoading: Boolean(dappUrl) && isFetching }
}
