import { useMemo } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useBannerStorage, BannerType } from './useBannerStorage'
import { useIsHypernativeGuard } from './useIsHypernativeGuard'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useIsHypernativeFeature } from './useIsHypernativeFeature'
import { IS_PRODUCTION } from '@/config/constants'

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
 * Checks if all conditions are met for showing the banner.
 *
 * @param isEnabled - Whether Hypernative features are enabled
 * @param shouldShowBanner - Result from useBannerStorage hook
 * @param wallet - Connected wallet or null
 * @param isSafeOwner - Whether the wallet is a Safe owner
 * @param fiatTotal - Safe balance in fiat currency as string
 * @param isHypernativeGuard - Whether HypernativeGuard is installed
 * @returns true if all conditions are met, false otherwise
 */
const areAllConditionsMet = (
  isEnabled: boolean,
  shouldShowBanner: boolean,
  wallet: ConnectedWallet | null,
  isSafeOwner: boolean,
  fiatTotal: string,
  isHypernativeGuard: boolean,
): boolean => {
  return (
    isEnabled && shouldShowBanner && !!wallet && isSafeOwner && hasSufficientBalance(fiatTotal) && !isHypernativeGuard
  )
}

/**
 * Hook to determine if a banner should be shown based on multiple conditions.
 *
 * @param bannerType - The type of banner: BannerType.Promo or BannerType.Pending
 * @returns BannerVisibilityResult with showBanner flag and loading state
 *
 * Conditions checked (in order):
 * 1. useBannerStorage must return true
 * 2. Wallet must be connected
 * 3. Connected wallet must be an owner of the current Safe
 * 4. Safe must have balance > MIN_BALANCE_USD (production) or > 1 USD (non-production)
 * 5. Safe must not have HypernativeGuard installed
 *
 * If any condition fails, showBanner will be false.
 */
export const useBannerVisibility = (bannerType: BannerType): BannerVisibilityResult => {

  const isEnabled = useIsHypernativeFeature()

  const shouldShowBanner = useBannerStorage(bannerType)
  const wallet = useWallet()
  const isSafeOwner = useIsSafeOwner()
  const { balances, loading: balancesLoading } = useVisibleBalances()
  const { isHypernativeGuard, loading: guardLoading } = useIsHypernativeGuard()

  return useMemo(() => {
    const loading = balancesLoading || guardLoading

    if (loading) {
      return { showBanner: false, loading: true }
    }

    const showBanner = areAllConditionsMet(isEnabled, shouldShowBanner, wallet, isSafeOwner, balances.fiatTotal, isHypernativeGuard)

    return {
      showBanner,
      loading: false,
    }
  }, [isEnabled, shouldShowBanner, wallet, isSafeOwner, balances.fiatTotal, balancesLoading, isHypernativeGuard, guardLoading])
}

