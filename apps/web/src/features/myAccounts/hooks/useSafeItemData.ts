import { useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAppSelector } from '@/store'
import { useChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'
import useWallet from '@/hooks/wallets/useWallet'
import useOnceVisible from '@/hooks/useOnceVisible'
import { useGetHref } from '@/hooks/safes'
import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { extractCounterfactualSafeSetup, isPredictedSafeProps } from '@/features/counterfactual/services'
import { hasMultiChainAddNetworkFeature } from '@/features/multichain'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { useGetSafeOverviewQuery } from '@/store/slices'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { AppRoutes } from '@/config/routes'
import { OVERVIEW_LABELS } from '@/services/analytics'
import type { SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export type UseSafeItemDataOptions = {
  safeOverview?: SafeOverview
  isSpaceSafe?: boolean
}

export function useSafeItemData(safeItem: SafeItem, options?: UseSafeItemDataOptions) {
  const { chainId, address, isReadOnly } = safeItem
  const providedSafeOverview = options?.safeOverview
  const isSpaceSafe = options?.isSpaceSafe ?? false

  const router = useRouter()
  const chain = useChain(chainId)
  const safeAddress = useSafeAddress()
  const currChainId = useChainId()
  const { address: walletAddress } = useWallet() ?? {}
  const elementRef = useRef<HTMLDivElement>(null)
  const isVisible = useOnceVisible(elementRef)
  const getHref = useGetHref(router)

  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, address))
  const name = useAppSelector(selectAllAddressBooks)[chainId]?.[address]

  const isCurrentSafe = chainId === currChainId && sameAddress(safeAddress, address)
  const isWelcomePage = router.pathname === AppRoutes.welcome.accounts

  const href = useMemo(() => {
    return chain ? getHref(chain, address) : ''
  }, [chain, getHref, address])

  const isActivating = undeployedSafe ? undeployedSafe.status.status !== 'AWAITING_EXECUTION' : false

  const counterfactualSetup = undeployedSafe
    ? extractCounterfactualSafeSetup(undeployedSafe, chain?.chainId)
    : undefined

  const addNetworkFeatureEnabled = hasMultiChainAddNetworkFeature(chain)
  const isReplayable =
    addNetworkFeatureEnabled && !isReadOnly && (!undeployedSafe || !isPredictedSafeProps(undeployedSafe.props))

  const { data: fetchedSafeOverview } = useGetSafeOverviewQuery(
    undeployedSafe || !isVisible || providedSafeOverview !== undefined
      ? skipToken
      : {
          chainId: safeItem.chainId,
          safeAddress: safeItem.address,
          walletAddress,
        },
  )

  const safeOverview = providedSafeOverview ?? fetchedSafeOverview

  const threshold = safeOverview?.threshold ?? counterfactualSetup?.threshold ?? defaultSafeInfo.threshold
  const owners =
    safeOverview?.owners ?? counterfactualSetup?.owners.map((addr) => ({ value: addr })) ?? defaultSafeInfo.owners

  const trackingLabel = isWelcomePage
    ? OVERVIEW_LABELS.login_page
    : isSpaceSafe
      ? OVERVIEW_LABELS.space_page
      : OVERVIEW_LABELS.sidebar

  return {
    // Core data
    chain,
    name,
    href,
    safeOverview,

    // Derived state
    isCurrentSafe,
    isActivating,
    isReplayable,
    isWelcomePage,

    // Safe details
    threshold,
    owners,

    // Counterfactual
    undeployedSafe,
    counterfactualSetup,

    // Visibility tracking
    elementRef,
    isVisible,

    // Analytics
    trackingLabel,
  }
}
