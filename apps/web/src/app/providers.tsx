'use client'

import Analytics from '@/services/analytics/Analytics'
import { SentryErrorBoundary } from '@/services/sentry'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Provider } from 'react-redux'
import { useServerInsertedHTML, usePathname } from 'next/navigation'
import CssBaseline from '@mui/material/CssBaseline'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import { setBaseUrl as setGatewayBaseUrl } from '@safe-global/safe-gateway-typescript-sdk'
import { setBaseUrl as setNewGatewayBaseUrl } from '@safe-global/safe-client-gateway-sdk'
import { CacheProvider } from '@emotion/react'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { makeStore, useHydrateStore } from '@/store'
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
import CookieAndTermBanner from '@/components/common/CookieAndTermBanner'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useTxTracking } from '@/hooks/useTxTracking'
import { useSafeMsgTracking } from '@/hooks/messages/useSafeMsgTracking'
import useGtm from '@/services/analytics/useGtm'
import useBeamer from '@/hooks/Beamer/useBeamer'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import createEmotionCache from '@/utils/createEmotionCache'
import useAdjustUrl from '@/hooks/useAdjustUrl'
import useSafeMessageNotifications from '@/hooks/messages/useSafeMessageNotifications'
import useSafeMessagePendingStatuses from '@/hooks/messages/useSafeMessagePendingStatuses'
import { TxModalProvider } from '@/components/tx-flow'
import { useNotificationTracking } from '@/components/settings/PushNotifications/hooks/useNotificationTracking'
import Recovery from '@/features/recovery/components/Recovery'
import WalletProvider from '@/components/common/WalletProvider'
import CounterfactualHooks from '@/features/counterfactual/CounterfactualHooks'
import PkModulePopup from '@/services/private-key-module/PkModulePopup'
import GeoblockingProvider from '@/components/common/GeoblockingProvider'
import { useVisitedSafes } from '@/features/myAccounts/hooks/useVisitedSafes'
import OutreachPopup from '@/features/targetedOutreach/components/OutreachPopup'
import { GATEWAY_URL } from '@/config/gateway'
import { useDatadog } from '@/services/datadog'
import useMixpanel from '@/services/analytics/useMixpanel'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'

const reduxStore = makeStore()

const InitApp = (): null => {
  setGatewayBaseUrl(GATEWAY_URL)
  setNewGatewayBaseUrl(GATEWAY_URL)
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

  return null
}

const EmotionCacheProvider = ({ children }: { children: ReactNode }) => {
  const [emotionCache] = useState(() => createEmotionCache())

  useServerInsertedHTML(() => (
    <style
      data-emotion={`${emotionCache.key} ${Object.keys(emotionCache.inserted).join(' ')}`}
      dangerouslySetInnerHTML={{ __html: Object.values(emotionCache.inserted).join(' ') }}
    />
  ))

  return <CacheProvider value={emotionCache}>{children}</CacheProvider>
}

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const isDarkMode = useDarkMode()
  const themeMode = isDarkMode ? 'dark' : 'light'
  const pathname = usePathname()

  return (
    <Provider store={reduxStore}>
      <EmotionCacheProvider>
        <SafeThemeProvider mode={themeMode}>
          {(safeTheme: Theme) => (
            <ThemeProvider theme={safeTheme}>
              <SentryErrorBoundary showDialog fallback={ErrorBoundary}>
                <WalletProvider>
                  <GeoblockingProvider>
                    <TxModalProvider>
                      <AddressBookSourceProvider>
                        <CssBaseline />

                        <InitApp />

                        <PageLayout pathname={pathname}>{children}</PageLayout>

                        <CookieAndTermBanner />

                        <OutreachPopup />

                        <Notifications />

                        <Recovery />

                        <CounterfactualHooks />

                        <Analytics />

                        <PkModulePopup />
                      </AddressBookSourceProvider>
                    </TxModalProvider>
                  </GeoblockingProvider>
                </WalletProvider>
              </SentryErrorBoundary>
            </ThemeProvider>
          )}
        </SafeThemeProvider>
      </EmotionCacheProvider>
    </Provider>
  )
}

export default AppProviders
