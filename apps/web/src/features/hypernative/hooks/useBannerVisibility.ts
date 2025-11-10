import { useMemo } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useShouldShowBanner, BannerType } from './useShouldShowBanner'
import { useIsHypernativeGuard } from './useIsHypernativeGuard'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

/**
 * Minimum USD balance threshold for showing the banner.
 * Safe must have balance greater than this value to show the banner.
 */
export const MIN_BALANCE_USD = 1_000_000

export type BannerVisibilityResult = {
  showBanner: boolean
  loading: boolean
}

/**
 * Checks if the Safe balance exceeds the minimum threshold.
 *
 * @param fiatTotal - The fiat total balance as a string
 * @returns true if balance is greater than MIN_BALANCE_USD, false otherwise
 */
const hasSufficientBalance = (fiatTotal: string): boolean => {
  const balance = Number(fiatTotal) || 0
  return balance > MIN_BALANCE_USD
}

/**
 * Checks if all conditions are met for showing the banner.
 *
 * @param shouldShowBanner - Result from useShouldShowBanner hook
 * @param wallet - Connected wallet or null
 * @param isSafeOwner - Whether the wallet is a Safe owner
 * @param fiatTotal - Safe balance in fiat currency as string
 * @param isHypernativeGuard - Whether HypernativeGuard is installed
 * @returns true if all conditions are met, false otherwise
 */
const areAllConditionsMet = (
  shouldShowBanner: boolean,
  wallet: ConnectedWallet | null,
  isSafeOwner: boolean,
  fiatTotal: string,
  isHypernativeGuard: boolean,
): boolean => {
  return (
    shouldShowBanner && !!wallet && isSafeOwner && hasSufficientBalance(fiatTotal) && !isHypernativeGuard
  )
}

/**
 * Hook to determine if a banner should be shown based on multiple conditions.
 *
 * @param bannerType - The type of banner: BannerType.Promo or BannerType.Pending
 * @returns BannerVisibilityResult with showBanner flag and loading state
 *
 * Conditions checked (in order):
 * 1. useShouldShowBanner must return true
 * 2. Wallet must be connected
 * 3. Connected wallet must be an owner of the current Safe
 * 4. Safe must have balance > MIN_BALANCE_USD
 * 5. Safe must not have HypernativeGuard installed
 *
 * If any condition fails, showBanner will be false.
 */
export const useBannerVisibility = (bannerType: BannerType): BannerVisibilityResult => {
  const shouldShowBanner = useShouldShowBanner(bannerType)
  const wallet = useWallet()
  const isSafeOwner = useIsSafeOwner()
  const { balances, loading: balancesLoading } = useVisibleBalances()
  const { isHypernativeGuard, loading: guardLoading } = useIsHypernativeGuard()

  return useMemo(() => {
    const loading = balancesLoading || guardLoading

    if (loading) {
      return { showBanner: false, loading: true }
    }

    const showBanner = areAllConditionsMet(shouldShowBanner, wallet, isSafeOwner, balances.fiatTotal, isHypernativeGuard)

    return {
      showBanner,
      loading: false,
    }
  }, [shouldShowBanner, wallet, isSafeOwner, balances.fiatTotal, balancesLoading, isHypernativeGuard, guardLoading])
}

