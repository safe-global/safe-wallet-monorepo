import Analytics from '@/services/analytics/Analytics'
import { SentryErrorBoundary } from '@/services/sentry'
import type { ReactNode } from 'react'
import { type ReactElement } from 'react'
import { type AppProps } from 'next/app'
import Head from 'next/head'
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
import { useInitOnboard } from '@/hooks/wallets/useOnboard'
import { useInitWeb3 } from '@/hooks/wallets/useInitWeb3'
import { useInitSafeCoreSDK } from '@/hooks/coreSDK/useInitSafeCoreSDK'
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
import Recovery from '@/features/recovery/components/Recovery'
import WalletProvider from '@/components/common/WalletProvider'
import IframeWalletProvider from '@/components/common/IframeWalletProvider'
import CounterfactualHooks from '@/features/counterfactual/CounterfactualHooks'
import { useIframeMode } from '@/hooks/useIframeMode'
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

// Standalone mode initialization (full feature set)
const InitAppStandalone = (): null => {
  useHydrateStore(reduxStore)
  useAdjustUrl()
  useDatadog()
  useGtm()
  useMixpanel()
  useNotificationTracking()
  useInitSession()
  useLoadableStores()
  useInitOnboard()
  useInitWeb3()
  useInitSafeCoreSDK()
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

// Iframe mode initialization (limited feature set, shell handles analytics/onboard)
const InitAppIframe = (): null => {
  useHydrateStore(reduxStore)
  useAdjustUrl()
  useInitSession()
  useLoadableStores()
  useInitWeb3()
  useInitSafeCoreSDK()
  useTxNotifications()
  useSafeMessageNotifications()
  useSafeNotifications()
  useTxPendingStatuses()
  useSafeMessagePendingStatuses()
  useTxTracking()
  useSafeMsgTracking()
  useVisitedSafes()
  usePortfolioRefetchOnTxHistory()

  return null
}

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'

export const AppProviders = ({ children, isIframe }: { children: ReactNode | ReactNode[]; isIframe: boolean }) => {
  const isDarkMode = useDarkMode()
  const themeMode = isDarkMode ? THEME_DARK : THEME_LIGHT
  const WalletProviderComponent = isIframe ? IframeWalletProvider : WalletProvider

  return (
    <SafeThemeProvider mode={themeMode}>
      {(safeTheme: Theme) => (
        <ThemeProvider theme={safeTheme}>
          <SentryErrorBoundary showDialog fallback={ErrorBoundary}>
            <WalletProviderComponent>
              <GeoblockingProvider>
                <TxModalProvider>
                  <AddressBookSourceProvider>{children}</AddressBookSourceProvider>
                </TxModalProvider>
              </GeoblockingProvider>
            </WalletProviderComponent>
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
  const isIframe = useIframeMode()

  return (
    <Provider store={reduxStore}>
      <Head>
        <title key="default-title">{BRAND_NAME}</title>
        <MetaTags prefetchUrl={GATEWAY_URL} />
      </Head>

      <CacheProvider value={emotionCache}>
        <AppProviders isIframe={isIframe}>
          <CssBaseline />

          {isIframe ? <InitAppIframe /> : <InitAppStandalone />}

          <TermsGate>
            {isIframe ? (
              /* In iframe mode, shell provides header/sidebar - only render content */
              <Component {...pageProps} key={safeKey} />
            ) : (
              /* In standalone mode, render with PageLayout */
              <PageLayout pathname={router.pathname}>
                <Component {...pageProps} key={safeKey} />
              </PageLayout>
            )}

            {!isIframe && (
              <>
                <CookieAndTermBanner />
                <OutreachPopup />
              </>
            )}

            <Notifications />

            <Recovery />

            <CounterfactualHooks />

            {!isIframe && <Analytics />}

            <PkModulePopup />
          </TermsGate>
        </AppProviders>
      </CacheProvider>
    </Provider>
  )
}

export default SafeWalletApp
