/**
 * TanStack root route — mirrors apps/web/src/pages/_app.tsx as documented in
 * docs/migration/state/plan.md ("Provider tree to reproduce"). This file is
 * one of the few intentional copies in the migration; the rest of the
 * codebase is re-used from apps/web/src/** via path aliases.
 */
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { HelmetProvider, Helmet } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { CacheProvider } from '@emotion/react'
import CssBaseline from '@mui/material/CssBaseline'
import { lazy, memo, Suspense, useMemo, type ReactElement } from 'react'

// Reused verbatim from apps/web/src — the provider chain itself is exported.
import { AppProviders } from '@/pages/_app'
import { BRAND_NAME } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore, setStoreInstance, useHydrateStore, useInitStaticChains } from '@/store'
import createEmotionCache from '@/utils/createEmotionCache'
import MetaTags from '@/components/common/MetaTags'
import PageLayout from '@/components/common/PageLayout'
import PwaReloadPrompt from '../components/PwaReloadPrompt'
import Notifications from '@/components/common/Notifications'
import CookieAndTermBanner from '@/components/common/CookieAndTermBanner'
import { CaptchaProvider } from '@/components/common/Captcha'
import useChangedValue from '@/hooks/useChangedValue'
import useAdjustUrl from '@/hooks/useAdjustUrl'
import useGtm from '@/services/analytics/useGtm'
import useMixpanel from '@/services/analytics/useMixpanel'
import useBeamer from '@/hooks/Beamer/useBeamer'
import useLoadableStores from '@/hooks/useLoadableStores'
import useTxNotifications from '@/hooks/useTxNotifications'
import useSafeNotifications from '@/hooks/useSafeNotifications'
import useTxPendingStatuses from '@/hooks/useTxPendingStatuses'
import useSafeMessageNotifications from '@/hooks/messages/useSafeMessageNotifications'
import useSafeMessagePendingStatuses from '@/hooks/messages/useSafeMessagePendingStatuses'
import { useInitSession } from '@/hooks/useInitSession'
import { useInitWeb3 } from '@/hooks/wallets/useInitWeb3'
import { useTxTracking } from '@/hooks/useTxTracking'
import { useSafeMsgTracking } from '@/hooks/messages/useSafeMsgTracking'
import { useNotificationTracking } from '@/components/settings/PushNotifications/hooks/useNotificationTracking'
import { useVisitedSafes } from '@/features/myAccounts'
import { usePortfolioRefetchOnTxHistory } from '@/features/portfolio'
import { useOidcLoginCallback } from '@/features/oidc-auth'
import { useLogoutCallback } from '@/hooks/useLogoutCallback'
import { useSessionExpiryGuard } from '@/services/sessionExpiry/useSessionExpiryGuard'
import { initObservability } from '@/services/observability'
import Analytics from '@/services/analytics/Analytics'
import PkModulePopup from '@/services/private-key-module/PkModulePopup'
import { useLoadFeature } from '@/features/__core__'
import { RecoveryFeature } from '@/features/recovery'
import { CounterfactualFeature } from '@/features/counterfactual'
import { SpendingLimitsFeature } from '@/features/spending-limits'
import { TargetedOutreachFeature } from '@/features/targeted-outreach'
import { useLocation, useSearch } from '@tanstack/react-router'

import '@/styles/globals.css'
import '@/styles/shadcn.css'

// Initialize observability before React mounts — matches apps/web/src/pages/_app.tsx:102.
if (typeof window !== 'undefined') {
  initObservability()
}

const reduxStore = makeStore()
setStoreInstance(reduxStore)
const emotionCache = createEmotionCache()

// LazyWeb3Init was `next/dynamic(..., { ssr: false })` — `ssr` is a no-op in
// the SPA, so a plain React.lazy is equivalent.
const LazyWeb3Init = lazy(() => import('@/components/common/LazyWeb3Init'))

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
  useOidcLoginCallback()
  useLogoutCallback()
  useSessionExpiryGuard()
  return null
}

// Memoized subtree — bails out of re-render when pathname and outlet are
// stable. RootShell otherwise re-renders many times during one navigation
// (TanStack Router emits internal state updates while loading) and dragged
// this whole tree through each commit. Wrapping isolates the bulk of the
// work behind a single props-equality check.
const MemoizedTree = memo(function MemoizedTree({ pathname, outlet }: { pathname: string; outlet: ReactElement }) {
  return (
    <>
      <PageLayout pathname={pathname}>{outlet}</PageLayout>
      <CookieAndTermBanner />
      <TargetedOutreachPopupLoader />
      <Notifications />
      <RecoveryLoader />
      <CounterfactualHooksLoader />
      <SpendingLimitsLoaderWrapper />
      <Analytics />
      <PkModulePopup />
    </>
  )
})

function RootShell() {
  // decisions.md: keep the useChangedValue page-key trick to force remount on
  // Safe switches until route-level regression tests cover stale state.
  const search = useSearch({ strict: false }) as { safe?: string }
  const safeKey = useChangedValue(search.safe?.toString())
  const location = useLocation()
  const outlet = useMemo(() => <Outlet key={safeKey} />, [safeKey])

  return (
    <Provider store={reduxStore}>
      <HelmetProvider>
        <Helmet>
          <title>{BRAND_NAME}</title>
        </Helmet>
        <MetaTags prefetchUrl={GATEWAY_URL} />
        <CacheProvider value={emotionCache}>
          <AppProviders>
            <CssBaseline />
            <CaptchaProvider>
              <InitApp />
              <PwaReloadPrompt />
              <Suspense fallback={null}>
                <LazyWeb3Init />
              </Suspense>
              <MemoizedTree pathname={location.pathname} outlet={outlet} />
            </CaptchaProvider>
          </AppProviders>
        </CacheProvider>
      </HelmetProvider>
    </Provider>
  )
}

// `useDarkMode` runs inside AppProviders (which sits below the Redux Provider),
// so the root component is just RootShell — no extra bridge needed.
export const Route = createRootRoute({
  component: RootShell,
  notFoundComponent: () => null,
})
