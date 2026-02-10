import Analytics from '@/services/analytics/Analytics'
import type { ReactNode } from 'react'
import { type ReactElement } from 'react'
import { type AppProps } from 'next/app'
import Head from 'next/head'
import dynamic from 'next/dynamic'

// Lazy-load Web3 initialization to keep viem/protocol-kit out of the main _app chunk
const LazyWeb3Init = dynamic(() => import('@/components/common/LazyWeb3Init'), { ssr: false })
import { Provider } from 'react-redux'
import CssBaseline from '@mui/material/CssBaseline'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import { CacheProvider, type EmotionCache } from '@emotion/react'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import '@/styles/globals.css'
import { BRAND_NAME } from '@/config/constants'
import { makeStore, setStoreInstance, useHydrateStore } from '@/store'
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

/**
 * Wrapper that lazy-loads Recovery via the feature system.
 */
const RecoveryLoader = () => {
  const { Recovery } = useLoadFeature(RecoveryFeature)
  return <Recovery />
}

/**
 * Wrapper that lazy-loads CounterfactualHooks via the feature system.
 * This ensures the entire counterfactual feature loads as a single chunk
 * through handle.ts rather than scattered next/dynamic imports.
 */
const CounterfactualHooksLoader = () => {
  const { CounterfactualHooks } = useLoadFeature(CounterfactualFeature)
  return <CounterfactualHooks />
}

/**
 * Wrapper that lazy-loads SpendingLimitsLoader via the feature system.
 */
const SpendingLimitsLoaderWrapper = () => {
  const { SpendingLimitsLoader } = useLoadFeature(SpendingLimitsFeature)
  return <SpendingLimitsLoader />
}

/**
 * Wrapper that lazy-loads OutreachPopup via the feature system.
 * This ensures the entire targeted-outreach feature loads as a single chunk.
 */
const TargetedOutreachPopupLoader = () => {
  const { OutreachPopup } = useLoadFeature(TargetedOutreachFeature)
  return <OutreachPopup />
}
import PkModulePopup from '@/services/private-key-module/PkModulePopup'
import GeoblockingProvider from '@/components/common/GeoblockingProvider'
import { useVisitedSafes } from '@/features/myAccounts'
import { usePortfolioRefetchOnTxHistory } from '@/features/portfolio'
import { GATEWAY_URL } from '@/config/gateway'
import { captureException, initObservability } from '@/services/observability'
import useMixpanel from '@/services/analytics/useMixpanel'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import { useSafeLabsTerms } from '@/hooks/useSafeLabsTerms'
import { HnQueueAssessmentProvider } from '@/features/hypernative'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'

// Initialize observability before React rendering starts
// This ensures we capture early page metrics (FCP, LCP, TTI) and errors during hydration
if (typeof window !== 'undefined') {
  initObservability()
}

const reduxStore = makeStore()
setStoreInstance(reduxStore)

const InitApp = (): null => {
  useHydrateStore(reduxStore)
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
  useSafeLabsTerms() // Automatically disconnect wallets if terms not accepted and feature is enabled

  return null
}

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

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

interface SafeWalletAppProps extends AppProps {
  emotionCache?: EmotionCache
}

const TermsGate = ({ children }: { children: ReactNode }) => {
  const { shouldShowContent } = useSafeLabsTerms()

  if (!shouldShowContent) {
    return null
  }

  return <>{children}</>
}

const SafeWalletApp = ({
  Component,
  pageProps,
  router,
  emotionCache = clientSideEmotionCache,
}: SafeWalletAppProps): ReactElement => {
  const safeKey = useChangedValue(router.query.safe?.toString())

  return (
    <Provider store={reduxStore}>
      <Head>
        <title key="default-title">{BRAND_NAME}</title>
        <MetaTags prefetchUrl={GATEWAY_URL} />
      </Head>

      <CacheProvider value={emotionCache}>
        <AppProviders>
          <CssBaseline />

          <InitApp />

          <LazyWeb3Init />

          <TermsGate>
            <PageLayout pathname={router.pathname}>
              <Component {...pageProps} key={safeKey} />
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
        </AppProviders>
      </CacheProvider>
    </Provider>
  )
}

export default SafeWalletApp
