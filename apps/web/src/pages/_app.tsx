import Analytics from '@/services/analytics/Analytics'
import { SentryErrorBoundary } from '@/services/sentry'
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
import ErrorBoundary from '@/components/common/ErrorBoundary'
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
import { useLoadFeature } from '@/features/__core__'

/**
 * Wrapper that lazy-loads Recovery via the feature system.
 * This ensures the entire recovery feature loads as a single chunk.
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
import PkModulePopup from '@/services/private-key-module/PkModulePopup'
import GeoblockingProvider from '@/components/common/GeoblockingProvider'
import { useVisitedSafes } from '@/features/myAccounts/hooks/useVisitedSafes'
import usePortfolioRefetchOnTxHistory from '@/features/portfolio/hooks/usePortfolioRefetchOnTxHistory'
import OutreachPopup from '@/features/targetedOutreach/components/OutreachPopup'
import { GATEWAY_URL } from '@/config/gateway'
import { useDatadog } from '@/services/datadog'
import useMixpanel from '@/services/analytics/useMixpanel'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import { useSafeLabsTerms } from '@/hooks/useSafeLabsTerms'

const reduxStore = makeStore()
setStoreInstance(reduxStore)

const InitApp = (): null => {
  useHydrateStore(reduxStore)
  useAdjustUrl()
  useDatadog()
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

  return (
    <SafeThemeProvider mode={themeMode}>
      {(safeTheme: Theme) => (
        <ThemeProvider theme={safeTheme}>
          <SentryErrorBoundary showDialog fallback={ErrorBoundary}>
            <WalletProvider>
              <GeoblockingProvider>
                <TxModalProvider>
                  <AddressBookSourceProvider>{children}</AddressBookSourceProvider>
                </TxModalProvider>
              </GeoblockingProvider>
            </WalletProvider>
          </SentryErrorBoundary>
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

            <OutreachPopup />

            <Notifications />

            <RecoveryLoader />

            <CounterfactualHooksLoader />

            <Analytics />

            <PkModulePopup />
          </TermsGate>
        </AppProviders>
      </CacheProvider>
    </Provider>
  )
}

export default SafeWalletApp
