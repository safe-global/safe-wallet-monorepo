import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectSafeHnState } from '../store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'

export enum BannerType {
  Promo = 'promo',
  Pending = 'pending',
}

/**
 * Hook to determine if a banner should be shown based on the banner type and Hypernative state.
 *
 * @param bannerType - The type of banner: BannerType.Promo or BannerType.Pending
 * @returns true if the banner should be shown, false otherwise
 *
 * Logic:
 * - For BannerType.Promo: Returns false if bannerDismissed or formCompleted is true, otherwise true
 * - For BannerType.Pending: Returns true if formCompleted is true AND pendingBannerDismissed is false, otherwise false
 */
export const useShouldShowBanner = (bannerType: BannerType): boolean => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()

  const safeHnState = useAppSelector((state) => selectSafeHnState(state, chainId, safeAddress))

  return useMemo(() => {
    if (!safeHnState) {
      // If no state exists, show promo banner by default, hide pending banner
      return bannerType === BannerType.Promo
    }

    if (bannerType === BannerType.Promo) {
      // Return false if bannerDismissed or formCompleted is true
      return !safeHnState.bannerDismissed && !safeHnState.formCompleted
    }

    // bannerType === BannerType.Pending
    // Return true if formCompleted is true AND pendingBannerDismissed is false
    return safeHnState.formCompleted && !safeHnState.pendingBannerDismissed
  }, [safeHnState, bannerType])
}

