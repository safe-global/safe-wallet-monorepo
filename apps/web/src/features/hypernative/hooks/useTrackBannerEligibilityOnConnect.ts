import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { selectSafeHnState, setBannerEligibilityTracked } from '../store/hnStateSlice'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { HYPERNATIVE_EVENTS } from '@/services/analytics/events/hypernative'
import type { BannerVisibilityResult } from './useBannerVisibility'
import { BannerType } from './useBannerStorage'

/**
 * Hook to track once per wallet connection when Safe loads and satisfies banner rendering conditions.
 * Uses Redux state (persisted to localStorage) to prevent duplicate tracking even if user:
 * - Dismisses the banner
 * - Switches to another Safe
 * - Returns to the same Safe
 *
 * The tracking flag persists across Safe switches and page reloads.
 *
 * @param visibilityResult - The banner visibility result from useBannerVisibility
 * @param bannerType - The type of banner (used to skip tracking for TxReportButton and Pending)
 */
export const useTrackBannerEligibilityOnConnect = (
  visibilityResult: BannerVisibilityResult,
  bannerType?: BannerType,
): void => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { safeAddress, safeLoaded, safeLoading } = useSafeInfo()
  const safeHnState = useAppSelector((state) => selectSafeHnState(state, chainId, safeAddress))

  // Use ref to track if we've already initiated tracking for this Safe (prevents race condition)
  const trackingInitiatedRef = useRef<string | null>(null)

  useEffect(() => {
    // Reset ref when Safe changes
    const safeKey = chainId && safeAddress ? `${chainId}:${safeAddress}` : null
    if (safeKey !== trackingInitiatedRef.current) {
      trackingInitiatedRef.current = null
    }
  }, [chainId, safeAddress])

  useEffect(() => {
    // Skip tracking for:
    // - TxReportButton: shows even when guard is already installed
    // - Pending: only appears after promo banner was viewed (which already triggered tracking)
    if (bannerType === BannerType.TxReportButton || bannerType === BannerType.Pending) {
      return
    }

    // Only track if:
    // 1. Safe info is fully loaded (not loading)
    // 2. We have a Safe address and chain ID
    // 3. Banner visibility check is complete (not loading)
    // 4. Haven't tracked for this Safe yet (check Redux state)
    if (safeLoading || !safeLoaded || !safeAddress || !chainId || visibilityResult.loading) {
      return
    }

    const safeKey = `${chainId}:${safeAddress}`

    // Check if we've already tracked for this Safe (Redux state)
    const alreadyTracked = safeHnState?.bannerEligibilityTracked ?? false
    if (alreadyTracked) {
      return // Already tracked, don't track again
    }

    // Check if we've already initiated tracking in this effect run (prevents race condition)
    if (trackingInitiatedRef.current === safeKey) {
      return // Already initiated tracking, don't track again
    }

    // Only track if banner should be shown
    if (!visibilityResult.showBanner) {
      return
    }

    // Mark as initiated immediately to prevent race condition
    trackingInitiatedRef.current = safeKey

    // Mark as tracked in Redux FIRST (before trackEvent) to prevent duplicate calls
    dispatch(setBannerEligibilityTracked({ chainId, safeAddress, tracked: true }))

    // Track banner viewed event
    trackEvent(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
      [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
      [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
    })
  }, [
    safeLoaded,
    safeLoading,
    safeAddress,
    chainId,
    visibilityResult.showBanner,
    visibilityResult.loading,
    safeHnState,
    dispatch,
    bannerType,
  ])
}
