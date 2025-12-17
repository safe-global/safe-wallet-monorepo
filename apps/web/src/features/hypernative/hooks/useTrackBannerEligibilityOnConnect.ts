import { useEffect, useRef, useMemo } from 'react'
import { useAppDispatch, useAppSelector, type RootState } from '@/store'
import { useStore } from 'react-redux'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { selectSafeHnState, setBannerEligibilityTracked } from '../store/hnStateSlice'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { HYPERNATIVE_EVENTS } from '@/services/analytics/events/hypernative'
import type { BannerVisibilityResult } from './useBannerVisibility'
import { BannerType } from './useBannerStorage'

//A shared Set across hook instances to prevent concurrent tracking for the same Safe
export const activeTrackingSafes = new Set<string>()

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
  const store = useStore()
  const chainId = useChainId()
  const { safeAddress, safeLoaded, safeLoading, safe } = useSafeInfo()
  const safeHnState = useAppSelector((state) => selectSafeHnState(state, chainId, safeAddress))

  // Extract primitives from objects to prevent unnecessary re-runs when object references change
  const bannerEligibilityTracked = safeHnState?.bannerEligibilityTracked ?? false
  const safeDeployed = safe?.deployed ?? false
  const showBanner = visibilityResult.showBanner
  const isLoading = visibilityResult.loading

  // Use ref to track if we've already initiated tracking for this Safe (prevents race condition)
  const trackingInitiatedRef = useRef<string | null>(null)
  // Use ref to track if we've already completed tracking for this Safe in this session
  const hasTrackedRef = useRef<string | null>(null)
  // Use ref to track the current safeKey to detect changes
  const previousSafeKeyRef = useRef<string | null>(null)

  const safeKey = useMemo(() => {
    return chainId && safeAddress ? `${chainId}:${safeAddress}` : null
  }, [chainId, safeAddress])

  useEffect(() => {
    // Reset refs when Safe changes
    if (safeKey !== previousSafeKeyRef.current) {
      trackingInitiatedRef.current = null
      hasTrackedRef.current = null
      previousSafeKeyRef.current = safeKey
    }
  }, [safeKey])

  useEffect(() => {
    return () => {
      if (safeKey) {
        activeTrackingSafes.delete(safeKey)
      }
    }
  }, [safeKey])

  useEffect(() => {
    // Skip tracking for:
    // - TxReportButton: shows even when guard is already installed
    // - Pending: only appears after promo banner was viewed (which already triggered tracking)
    if (bannerType === BannerType.TxReportButton || bannerType === BannerType.Pending) {
      return
    }

    // Dashboard banner on the FirstSteps page: Only when banner is visible (for undeployed Safes)
    if (bannerType === BannerType.NoBalanceCheck && safeDeployed) {
      return
    }

    // Only track if:
    // 1. Safe info is fully loaded (not loading)
    // 2. We have a Safe address and chain ID
    // 3. Banner visibility check is complete (not loading)
    // 4. Haven't tracked for this Safe yet (check Redux state and session ref)
    if (safeLoading || !safeLoaded || !safeAddress || !chainId || isLoading || !safeKey) {
      return
    }

    // Check if we've already tracked in this session (prevents re-tracking on re-renders)
    if (hasTrackedRef.current === safeKey) {
      return
    }

    // Check if we've already tracked for this Safe (Redux state)
    // Check BOTH the selector value (reactive) AND the current store state (fresh)
    // This prevents race conditions where multiple components mount simultaneously
    const currentSafeHnState = selectSafeHnState(store.getState() as RootState, chainId, safeAddress)
    const alreadyTracked = bannerEligibilityTracked || currentSafeHnState?.bannerEligibilityTracked

    if (alreadyTracked) {
      hasTrackedRef.current = safeKey // Mark as tracked in this session
      return // Already tracked, don't track again
    }

    // Only track if banner should be shown
    if (!showBanner) {
      return
    }

    // Atomic check-and-add: prevent concurrent tracking from multiple components
    if (activeTrackingSafes.has(safeKey)) {
      return // Another instance already initiated tracking
    }
    activeTrackingSafes.add(safeKey)

    // Check if we've already initiated tracking in this effect run (prevents race condition)
    if (trackingInitiatedRef.current === safeKey) {
      activeTrackingSafes.delete(safeKey) // Release lock if already initiated
      return // Already initiated tracking, don't track again
    }

    // Mark as initiated immediately to prevent race condition
    trackingInitiatedRef.current = safeKey

    // Mark as tracked in Redux FIRST (before trackEvent) to prevent duplicate calls
    dispatch(setBannerEligibilityTracked({ chainId, safeAddress, tracked: true }))

    // Mark as tracked in this session
    hasTrackedRef.current = safeKey

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
    showBanner,
    isLoading,
    bannerEligibilityTracked,
    dispatch,
    bannerType,
    store,
    safeDeployed,
    safeKey,
  ])
}
