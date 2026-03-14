/**
 * App shell — wraps all routes with providers, layout, and global components.
 * Replaces Next.js _app.tsx + _document.tsx for the Vite SPA.
 */
import { Suspense, type ReactElement, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Provider } from 'react-redux'
import CssBaseline from '@mui/material/CssBaseline'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import Head from 'next/head'
import dynamic from 'next/dynamic'

import Analytics from '@/services/analytics/Analytics'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { BRAND_NAME } from '@/config/constants'
import { makeStore, setStoreInstance, useHydrateStore, useInitStaticChains } from '@/store'
import PageLayout from '@/components/common/PageLayout'
import useLoadableStores from '@/hooks/useLoadableStores'
import { useInitWeb3 } from '@/hooks/wallets/useInitWeb3'
import useTxNotifications from '@/hooks/useTxNotifications'
import useSafeNotifications from '@/hooks/useSafeNotifications'
import useTxPendingStatuses from '@/hooks/useTxPendingStatuses'
import { useInitSession } from '@/hooks/useInitSession'
import Notifications from '@/components/common/Notifications'
import CookieAndTermBanner from 'src/components/common/CookieAndTermBanner'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useTxTracking } from '@/hooks/useTxTracking'
import { useSafeMsgTracking } from '@/hooks/messages/useSafeMsgTracking'
import useGtm from '@/services/analytics/useGtm'
import useBeamer from '@/hooks/Beamer/useBeamer'
import createEmotionCache from '@/utils/createEmotionCache'
import MetaTags from '@/components/common/MetaTags'
import useAdjustUrl from '@/hooks/useAdjustUrl'
import useSafeMessageNotifications from '@/hooks/messages/useSafeMessageNotifications'
import useSafeMessagePendingStatuses from '@/hooks/messages/useSafeMessagePendingStatuses'
import useChangedValue from '@/hooks/useChangedValue'
import { TxModalProvider } from '@/components/tx-flow'
import { useNotificationTracking } from '@/components/settings/PushNotifications/hooks/useNotificationTracking'
import WalletProvider from '@/components/common/WalletProvider'
import { CounterfactualFeature } from '@/features/counterfactual'
import { RecoveryFeature } from '@/features/recovery'
import { SpendingLimitsFeature } from '@/features/spending-limits'
import { useLoadFeature } from '@/features/__core__'
import { TargetedOutreachFeature } from '@/features/targeted-outreach'
import PkModulePopup from '@/services/private-key-module/PkModulePopup'
import GeoblockingProvider from '@/components/common/GeoblockingProvider'
import { useVisitedSafes } from '@/features/myAccounts'
import { usePortfolioRefetchOnTxHistory } from '@/features/portfolio'
import { GATEWAY_URL } from '@/config/gateway'
import { captureException, initObservability } from '@/services/observability'
import useMixpanel from '@/services/analytics/useMixpanel'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import { useSafeLabsTerms } from '@/hooks/useSafeLabsTerms'
import { CaptchaProvider } from '@/components/common/Captcha'
import { HnQueueAssessmentProvider } from '@/features/hypernative'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'

// Lazy-load Web3 initialization to keep viem/protocol-kit out of the main chunk
const LazyWeb3Init = dynamic(() => import('@/components/common/LazyWeb3Init'), { ssr: false })

// Initialize observability before React rendering starts
if (typeof window !== 'undefined') {
  initObservability()
}

const reduxStore = makeStore()
setStoreInstance(reduxStore)

const clientSideEmotionCache = createEmotionCache()

// ---------------------------------------------------------------------------
// Feature loaders (same as _app.tsx)
// ---------------------------------------------------------------------------

const RecoveryLoader = () => {
  const { Recovery } = useLoadFeature(RecoveryFeature)
  return <Recovery />
}

const CounterfactualHooksLoader = () => {
  const { CounterfactualHooks } = useLoadFeature(CounterfactualFeature)
  return <CounterfactualHooks />
}

const SpendingLimitsLoaderWrapper = () => {
  const { SpendingLimitsLoader } = useLoadFeature(SpendingLimitsFeature)
  return <SpendingLimitsLoader />
}

const TargetedOutreachPopupLoader = () => {
  const { OutreachPopup } = useLoadFeature(TargetedOutreachFeature)
  return <OutreachPopup />
}

// ---------------------------------------------------------------------------
// InitApp — runs all global hooks
// ---------------------------------------------------------------------------

const InitApp = (): null => {
  useHydrateStore(reduxStore)
  useInitStaticChains()
  useAdjustUrl()
  useGtm()
  useMixpanel()
  useNotificationTracking()
  useInitSession()
  useLoadableStores()
  useInitWeb3()
  useTxNotifications()
  useSafeMessageNotifications()
  useSafeNotifications()
  useTxPendingStatuses()
  useSafeMessagePendingStatuses()
  useTxTracking()
  useSafeMsgTracking()
  useBeamer()
  useVisitedSafes()
  usePortfolioRefetchOnTxHistory()
  useSafeLabsTerms()

  return null
}

// ---------------------------------------------------------------------------
// Theme + Error boundary providers (from _app.tsx AppProviders)
// ---------------------------------------------------------------------------

const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'

export const AppProviders = ({ children }: { children: ReactNode | ReactNode[] }) => {
  const isDarkMode = useDarkMode()
  const themeMode = isDarkMode ? THEME_DARK : THEME_LIGHT

  const handleError = (error: Error, componentStack?: string) => {
    captureException(error, { componentStack })
  }

  const content = (
    <WalletProvider>
      <GeoblockingProvider>
        <TxModalProvider>
          <AddressBookSourceProvider>
            <HnQueueAssessmentProvider>{children}</HnQueueAssessmentProvider>
          </AddressBookSourceProvider>
        </TxModalProvider>
      </GeoblockingProvider>
    </WalletProvider>
  )

  return (
    <SafeThemeProvider mode={themeMode}>
      {(safeTheme: Theme) => (
        <ThemeProvider theme={safeTheme}>
          <ObservabilityErrorBoundary onError={handleError}>{content}</ObservabilityErrorBoundary>
        </ThemeProvider>
      )}
    </SafeThemeProvider>
  )
}

// ---------------------------------------------------------------------------
// Terms gate (from _app.tsx)
// ---------------------------------------------------------------------------

const TermsGate = ({ children }: { children: ReactNode }) => {
  const { shouldShowContent } = useSafeLabsTerms()

  if (!shouldShowContent) {
    return null
  }

  return <>{children}</>
}

// ---------------------------------------------------------------------------
// AppShell — the layout route component
// ---------------------------------------------------------------------------

export default function AppShell(): ReactElement {
  const location = useLocation()
  const safeKey = useChangedValue(new URLSearchParams(location.search).get('safe'))

  return (
    <Provider store={reduxStore}>
      <Head>
        <title key="default-title">{BRAND_NAME}</title>
        <MetaTags prefetchUrl={GATEWAY_URL} />
      </Head>

      <CacheProvider value={clientSideEmotionCache}>
        <AppProviders>
          <CssBaseline />

          <CaptchaProvider>
            <InitApp />

            <LazyWeb3Init />

            <TermsGate>
              <PageLayout pathname={location.pathname}>
                <Suspense fallback={null}>
                  <Outlet key={safeKey} />
                </Suspense>
              </PageLayout>

              <CookieAndTermBanner />

              <TargetedOutreachPopupLoader />

              <Notifications />

              <RecoveryLoader />

              <CounterfactualHooksLoader />

              <SpendingLimitsLoaderWrapper />

              <Analytics />

              <PkModulePopup />
            </TermsGate>
          </CaptchaProvider>
        </AppProviders>
      </CacheProvider>
    </Provider>
  )
}
