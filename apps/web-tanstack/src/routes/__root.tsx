/**
 * TanStack root route — mirrors the provider tree of apps/web/src/pages/_app.tsx.
 * This file is one of the few intentional copies in the migration; the rest of
 * the codebase is re-used from apps/web/src/** via path aliases.
 */
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { HelmetProvider, Helmet } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { lazy, memo, Suspense, useMemo, type ReactElement } from 'react'

// Reused verbatim from apps/web/src — the provider chain itself is exported.
import { AppProviders, SafeScopedSubscriptions } from '@/pages/_app'
import { BRAND_NAME } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore, setStoreInstance, useHydrateStore, useInitChains } from '@/store'
import MetaTags from '@/components/common/MetaTags'
import PageLayout from '@/components/common/PageLayout'
import PwaReloadPrompt from '../components/PwaReloadPrompt'
import AppChrome from '@/components/common/AppChrome'
import { CaptchaProvider } from '@/components/common/Captcha/CaptchaProvider'
import useChangedValue from '@/hooks/useChangedValue'
import useAdjustUrl from '@/hooks/useAdjustUrl'
import useGtm from '@/services/analytics/useGtm'
import useMixpanel from '@/services/analytics/useMixpanel'
import useLoadableStores from '@/hooks/useLoadableStores'
import useUnlockBodyScroll from '@/hooks/useUnlockBodyScroll'
import { useRememberSpace } from '@/hooks/useRememberSpace'
import { useInitSession } from '@/hooks/useInitSession'
import { useInitWeb3 } from '@/hooks/wallets/useInitWeb3'
import { useNotificationTracking } from '@/components/settings/PushNotifications/hooks/useNotificationTracking'
import { useVisitedSafes } from '@/features/myAccounts/public/useVisitedSafes'
import { useOidcLoginCallback } from '@/features/oidc-auth/public/useOidcLoginCallback'
import { useStepUpRecovery } from '@/features/oidc-auth/public/useStepUpRecovery'
import { useLogoutCallback } from '@/hooks/useLogoutCallback'
import { useSessionExpiryGuard } from '@/services/sessionExpiry/useSessionExpiryGuard'
import { useHypernativeTokenRefresh } from '@/features/hypernative/public/useHypernativeTokenRefresh'
import { initObservability } from '@/services/observability'
import Analytics from '@/services/analytics/Analytics'
import Recovery from '@/features/recovery/public/Recovery'
import CounterfactualHooks from '@/features/counterfactual/public/CounterfactualHooks'
import { useLocation, useSearch } from '@tanstack/react-router'
import SpendingLimitsLoader from '@/features/spending-limits/public/SpendingLimitsLoader'

import '@/styles/globals.css'
import '@/styles/shadcn.css'

// Initialize observability before React mounts — matches apps/web/src/pages/_app.tsx:102.
if (typeof window !== 'undefined') {
  initObservability()
}

const reduxStore = makeStore()
setStoreInstance(reduxStore)

// LazyWeb3Init was `next/dynamic(..., { ssr: false })` — `ssr` is a no-op in
// the SPA, so a plain React.lazy is equivalent.
const LazyWeb3Init = lazy(() => import('@/components/common/LazyWeb3Init'))

const SpendingLimitsLoaderWrapper = () => {
  return <SpendingLimitsLoader />
}

const InitApp = (): ReactElement => {
  useHydrateStore(reduxStore)
  useInitChains()
  useAdjustUrl()
  useGtm()
  useMixpanel()
  useNotificationTracking()
  useInitSession()
  useLoadableStores()
  useInitWeb3()
  useVisitedSafes()
  useOidcLoginCallback()
  useStepUpRecovery()
  useLogoutCallback()
  useSessionExpiryGuard()
  useHypernativeTokenRefresh()
  useUnlockBodyScroll()
  useRememberSpace()

  return <SafeScopedSubscriptions />
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
      <AppChrome />
      <Recovery />
      <CounterfactualHooks />
      <SpendingLimitsLoaderWrapper />
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
        <AppProviders>
          <CaptchaProvider>
            {/* Before InitApp and the page, so GA exists before their mount effects send events */}
            <Analytics />
            <InitApp />
            <PwaReloadPrompt />
            <Suspense fallback={null}>
              <LazyWeb3Init />
            </Suspense>
            <MemoizedTree pathname={location.pathname} outlet={outlet} />
          </CaptchaProvider>
        </AppProviders>
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
