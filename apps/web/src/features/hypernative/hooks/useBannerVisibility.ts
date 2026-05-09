import { useMemo } from 'react'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { BannerType, useBannerStorage } from './useBannerStorage'
import { useIsHypernativeGuard } from './useIsHypernativeGuard'
import { useIsHypernativeFeature } from './useIsHypernativeFeature'
import { useIsOutreachSafe } from '@/features/targeted-features'
import { HYPERNATIVE_OUTREACH_ID, HYPERNATIVE_ALLOWLIST_OUTREACH_ID } from '../constants'
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
 *    OR Safe is targeted AND has 0 balance (shows banner over "Add funds to get started")
 * 5. For Promo/Pending/NoBalanceCheck/Settings: Safe must not have HypernativeGuard installed
 *    For TxReportButton: Requires isEnabled AND isSafeOwner, and either sufficient balance OR targeted Safe OR HypernativeGuard is installed OR Safe is in the allowlist
 *
 * If any condition fails, showBanner will be false.
 */
export const useBannerVisibility = (bannerType: BannerType): BannerVisibilityResult => {
  const isEnabled = useIsHypernativeFeature()

  const shouldShowBanner = useBannerStorage(bannerType)
  const isSafeOwner = useIsSafeOwner()
  const { balances, loading: balancesLoading } = useVisibleBalances()
  const { isHypernativeGuard, loading: guardLoading } = useIsHypernativeGuard()
  const isTxReportButton = bannerType === BannerType.TxReportButton
  const skipBalanceCheck = bannerType === BannerType.NoBalanceCheck

  const { isTargeted: isPromoTargeted, loading: outreachLoading } = useIsOutreachSafe(HYPERNATIVE_OUTREACH_ID, {
    skip: isTxReportButton,
  })
  const { isTargeted: isAllowlistedSafe, loading: allowlistLoading } = useIsOutreachSafe(
    HYPERNATIVE_ALLOWLIST_OUTREACH_ID,
    { skip: !isTxReportButton },
  )

  const hasEnoughBalance = hasSufficientBalance(balances.fiatTotal)

  const visibilityResult = useMemo(() => {
    // For NoBalanceCheck, skip balance loading check
    const extraEligibilityLoading = isTxReportButton ? allowlistLoading : false
    const loading =
      (skipBalanceCheck ? false : balancesLoading) || guardLoading || outreachLoading || extraEligibilityLoading

    if (loading) {
      return { showBanner: false, loading: true }
    }

    // For NoBalanceCheck, skip balance check (always pass)
    // For targeted Safes (including those with 0 balance/no assets), bypass balance check to show banner over "Add funds to get started"
    // This allows the Hypernative banner to be shown for targeted Safes even when they have 0 balance
    const hasSufficientBalanceCheck = skipBalanceCheck || hasEnoughBalance
    // Targeted Safes bypass balance requirement, allowing banner to show even with 0 balance
    const passesBalanceOrTargetedCheck = hasSufficientBalanceCheck || isPromoTargeted

    // For TxReportButton, require isEnabled AND isSafeOwner, and either sufficient balance OR targeted Safe OR guard is installed
    if (isTxReportButton) {
      const bannerConditionsMet = isEnabled && isSafeOwner
      const showBanner = bannerConditionsMet && (hasEnoughBalance || isAllowlistedSafe || isHypernativeGuard)

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
    balancesLoading,
    isHypernativeGuard,
    guardLoading,
    isPromoTargeted,
    outreachLoading,
    isAllowlistedSafe,
    allowlistLoading,
    hasEnoughBalance,
  ])

  // Track banner eligibility once per Safe connection
  // The hook will skip tracking internally for TxReportButton and Pending
  useTrackBannerEligibilityOnConnect(visibilityResult, bannerType)

  return visibilityResult
}
export { BannerType }
