import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useHasFeature } from '@/hooks/useChains'
import { hasAcceptedSafeLabsTerms } from '@/services/safe-labs-terms'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useOnboard from '@/hooks/wallets/useOnboard'
import { AppRoutes } from '@/config/routes'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import type { OnboardAPI, WalletState } from '@web3-onboard/core'
import { IS_PRODUCTION, IS_TEST_E2E } from '@/config/constants'

const TERMS_REDIRECT_EXCEPTIONS = [
  AppRoutes.safeLabsTerms,
  AppRoutes.privacy,
  AppRoutes.terms,
  AppRoutes.imprint,
  AppRoutes.cookie,
  AppRoutes.licenses,
]

interface UseSafeLabsTermsReturnType {
  isFeatureDisabled: boolean
  hasAccepted: boolean
  shouldBypassTermsCheck: boolean
  shouldShowContent: boolean
}

export const useSafeLabsTerms = (): UseSafeLabsTermsReturnType => {
  const isFeatureDisabled = useHasFeature(FEATURES.SAFE_LABS_TERMS_DISABLED) ?? false
  const isOfficialHost = useIsOfficialHost()
  const onboard = useOnboard()
  const router = useRouter()
  const hasRedirected = useRef(false)
  // Initialize to true for SSR/SSG - content should be pre-rendered
  // Client-side useEffect will handle redirects if terms not accepted
  const [shouldShowContent, setShouldShowContent] = useState(true)

  async function disconnectWalletsEIP2255(wallet: WalletState): Promise<void> {
    try {
      if (wallet.provider && 'request' in wallet.provider) {
        await wallet.provider.request({
          method: 'wallet_revokePermissions',
          params: [
            {
              eth_accounts: {},
            },
          ],
        })
      }
    } catch (error) {
      console.debug('Failed to revoke wallet permissions:', error)
    }
  }

  async function disconnectWalletsLedger(wallet: WalletState): Promise<void> {
    try {
      if (wallet.label?.toLowerCase().includes('ledger')) {
        // @ts-expect-error - Ledger transport may not be exposed in types but exists at runtime
        if (wallet.provider?.transport) {
          // @ts-expect-error - close() method exists on Ledger transport
          await wallet.provider.transport.close()
        }
        // @ts-expect-error - Ledger instance may have close method
        if (wallet.instance && typeof wallet.instance.close === 'function') {
          // @ts-expect-error - close() method
          await wallet.instance.close()
        }
      }
    } catch (error) {
      console.debug('Failed to close Ledger transport:', error)
    }
  }

  const disconnectWallets = useCallback((wallets: WalletState[], onboard: OnboardAPI) => {
    void Promise.all(
      wallets.map(async (wallet) => {
        await disconnectWalletsEIP2255(wallet)
        await disconnectWalletsLedger(wallet)
        onboard.disconnectWallet({ label: wallet.label })
      }),
    )
  }, [])

  useEffect(() => {
    const termsAccepted = hasAcceptedSafeLabsTerms()

    if (
      !isOfficialHost ||
      isFeatureDisabled ||
      !IS_PRODUCTION ||
      IS_TEST_E2E ||
      termsAccepted ||
      TERMS_REDIRECT_EXCEPTIONS.includes(router.pathname)
    ) {
      setShouldShowContent(true)
      hasRedirected.current = false
      return
    }

    // Hide content and redirect to terms page
    setShouldShowContent(false)

    if (!hasRedirected.current) {
      hasRedirected.current = true
      void router.replace({
        pathname: AppRoutes.safeLabsTerms,
        query: {
          redirect: router.asPath,
        },
      })
    }
  }, [isOfficialHost, isFeatureDisabled, router, router.pathname])

  useEffect(() => {
    const termsAccepted = hasAcceptedSafeLabsTerms()
    if (!isOfficialHost || !onboard || isFeatureDisabled || !IS_PRODUCTION || IS_TEST_E2E || termsAccepted) {
      return
    }

    const currentWallets = onboard.state.get().wallets
    if (currentWallets && currentWallets.length > 0) {
      disconnectWallets(currentWallets, onboard)
    }

    const walletSubscription = onboard.state.select('wallets').subscribe(async (wallets: WalletState[]) => {
      if (wallets && wallets.length > 0) {
        disconnectWallets(wallets, onboard)
      }
    })

    return () => {
      walletSubscription.unsubscribe()
    }
  }, [isOfficialHost, isFeatureDisabled, onboard, router.pathname, disconnectWallets])

  const termsAccepted = hasAcceptedSafeLabsTerms()

  return {
    isFeatureDisabled,
    hasAccepted: termsAccepted,
    shouldBypassTermsCheck: !isOfficialHost || isFeatureDisabled || !IS_PRODUCTION || IS_TEST_E2E || termsAccepted,
    shouldShowContent,
  }
}
