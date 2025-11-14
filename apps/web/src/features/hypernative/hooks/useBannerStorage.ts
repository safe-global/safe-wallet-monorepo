import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectSafeHnState } from '../store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'

export enum BannerType {
  Promo = 'promo',
  Pending = 'pending',
  TxReportButton = 'txReportButton',
  NoBalanceCheck = 'noBalanceCheck',
}

/**
 * Hook to determine if a banner should be shown based on the banner type and Hypernative state.
 *
 * @param bannerType - The type of banner: BannerType.Promo, BannerType.Pending, BannerType.TxReportButton, or BannerType.NoBalanceCheck
 * @returns true if the banner should be shown, false otherwise
 *
 * Logic:
 * - For BannerType.Promo: Returns false if bannerDismissed or formCompleted is true, otherwise true
 * - For BannerType.Pending: Returns true if formCompleted is true AND pendingBannerDismissed is false, otherwise false
 * - For BannerType.TxReportButton: Always returns true (ignores bannerDismissed and formCompleted)
 * - For BannerType.NoBalanceCheck: Same as BannerType.Promo, but used when balance cannot be checked (e.g., for undeployed safes)
 */
export const useBannerStorage = (bannerType: BannerType): boolean => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()

  const safeHnState = useAppSelector((state) => selectSafeHnState(state, chainId, safeAddress))

  return useMemo(() => {
    // TxReportButton ignores all state and always shows (subject to other visibility conditions)
    if (bannerType === BannerType.TxReportButton) {
      return true
    }

    if (!safeHnState) {
      // If no state exists, show promo banner by default, hide pending banner
      return bannerType === BannerType.Promo || bannerType === BannerType.NoBalanceCheck
    }

    if (bannerType === BannerType.Promo || bannerType === BannerType.NoBalanceCheck) {
      // Return false if bannerDismissed or formCompleted is true
      return !safeHnState.bannerDismissed && !safeHnState.formCompleted
    }

    // bannerType === BannerType.Pending
    // Return true if formCompleted is true AND pendingBannerDismissed is false
    return safeHnState.formCompleted && !safeHnState.pendingBannerDismissed
  }, [safeHnState, bannerType])
}
