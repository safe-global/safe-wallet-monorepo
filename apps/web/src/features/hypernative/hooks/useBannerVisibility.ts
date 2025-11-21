import { useMemo } from 'react'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { BannerType, useBannerStorage } from './useBannerStorage'
import { useIsHypernativeGuard } from './useIsHypernativeGuard'
import { useIsHypernativeFeature } from './useIsHypernativeFeature'
import { useIsOutreachSafe } from '@/features/targetedFeatures/hooks/useIsOutreachSafe'
import { HYPERNATIVE_OUTREACH_ID } from '../constants'
import { IS_PRODUCTION } from '@/config/constants'
import { useTrackBannerEligibilityOnConnect } from './useTrackBannerEligibilityOnConnect'

/**
 * Minimum USD balance threshold for showing the banner in production.
 * Safe must have balance greater than this value to show the banner.
 */
export const MIN_BALANCE_USD = IS_PRODUCTION ? 1_000_000 : 1

export type BannerVisibilityResult = {
  showBanner: boolean
  loading: boolean
}

/**
 * Checks if the Safe balance exceeds the minimum threshold.
 *
 * @param fiatTotal - The fiat total balance as a string
 * @returns true if balance is greater than the minimum threshold, false otherwise
 */
const hasSufficientBalance = (fiatTotal: string): boolean => {
  const balance = Number(fiatTotal) || 0
  return balance > MIN_BALANCE_USD
}

/**
 * Hook to determine if a banner should be shown based on multiple conditions.
 *
 * @param bannerType - The type of banner: BannerType.Promo, BannerType.Pending, BannerType.TxReportButton, BannerType.NoBalanceCheck, or BannerType.Settings
 * @returns BannerVisibilityResult with showBanner flag and loading state
 *
 * Conditions checked (in order):
 * 1. useBannerStorage must return true
 * 2. Wallet must be connected
 * 3. Connected wallet must be an owner of the current Safe
 * 4. Safe must have balance > MIN_BALANCE_USD (production) or > 1 USD (non-production) - skipped for BannerType.NoBalanceCheck
 *    OR Safe is in the targeted list (bypasses balance requirement)
 * 5. For Promo/Pending/NoBalanceCheck/Settings: Safe must not have HypernativeGuard installed
 *    For TxReportButton: Requires isEnabled AND isSafeOwner, and either sufficient balance OR HypernativeGuard is installed
 *
 * If any condition fails, showBanner will be false.
 */
export const useBannerVisibility = (bannerType: BannerType): BannerVisibilityResult => {
  const isEnabled = useIsHypernativeFeature()

  const shouldShowBanner = useBannerStorage(bannerType)
  const isSafeOwner = useIsSafeOwner()
  const { balances, loading: balancesLoading } = useVisibleBalances()
  const { isHypernativeGuard, loading: guardLoading } = useIsHypernativeGuard()
  const isTargetedSafe = useIsOutreachSafe(HYPERNATIVE_OUTREACH_ID)

  const visibilityResult = useMemo(() => {
    // For NoBalanceCheck, skip balance loading check
    const skipBalanceCheck = bannerType === BannerType.NoBalanceCheck
    const loading = (skipBalanceCheck ? false : balancesLoading) || guardLoading

    if (loading) {
      return { showBanner: false, loading: true }
    }

    // For NoBalanceCheck, skip balance check (always pass)
    // For targeted Safes, bypass balance check (works for all banner types including NoBalanceCheck)
    const hasSufficientBalanceCheck = skipBalanceCheck || hasSufficientBalance(balances.fiatTotal)
    const passesBalanceOrTargetedCheck = hasSufficientBalanceCheck || isTargetedSafe

    // For TxReportButton, require isEnabled AND isSafeOwner, and either sufficient balance OR guard is installed
    if (bannerType === BannerType.TxReportButton) {
      const bannerConditionsMet = isEnabled && isSafeOwner
      const showBanner = bannerConditionsMet && (hasSufficientBalanceCheck || isHypernativeGuard)

      return {
        showBanner,
        loading: false,
      }
    }

    // For other banner types (Promo, Pending, NoBalanceCheck, Settings), guard must NOT be installed
    // Targeted Safes can bypass balance requirement, but still need: isEnabled, shouldShowBanner, isSafeOwner, !isHypernativeGuard
    const showBanner =
      isEnabled && shouldShowBanner && isSafeOwner && passesBalanceOrTargetedCheck && !isHypernativeGuard

    return {
      showBanner,
      loading: false,
    }
  }, [
    bannerType,
    isEnabled,
    shouldShowBanner,
    isSafeOwner,
    balances.fiatTotal,
    balancesLoading,
    isHypernativeGuard,
    guardLoading,
    isTargetedSafe,
  ])

  // Track banner eligibility once per Safe connection
  // The hook will skip tracking internally for TxReportButton and Pending
  useTrackBannerEligibilityOnConnect(visibilityResult, bannerType)

  return visibilityResult
}
export { BannerType }
