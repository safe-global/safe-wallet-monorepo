import { useCallback, useContext, useEffect, useRef, useState, type ReactElement } from 'react'
import classnames from 'classnames'
import Topbar from '@/components/common/Header/Topbar'
import SafeLogo from '@/components/common/SafeLogo'
import css from './styles.module.css'
import SafeLoadingError from '../SafeLoadingError'
import Footer from '../Footer'
import SideDrawer from './SideDrawer'
import { useIsSidebarRoute } from '@/hooks/useIsSidebarRoute'
import { TxModalContext } from '@/components/tx-flow'
import { useLoadFeature } from '@/features/__core__'
import { BatchingFeature } from '@/features/batching'
import { SpacesFeature } from '@/features/spaces'
import { AppRoutes } from '@/config/routes'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { useParentSafe } from '@/hooks/useParentSafe'
import { useRouterGuard } from '@/hooks/useRouterGuard'
import { useFlowActivationGuard } from '@/hooks/useRouterGuard/activationGuards/useFlowActivationGuard'
import { useKeyboardObserver } from '@/hooks/useKeyboardObserver'
import { useIsTopbarElevated } from '@/hooks/useTopbarElevation'

const ONBOARDING_ROUTES = [
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
  AppRoutes.welcome.survey,
]

const STATIC_PAGE_ROUTES = [AppRoutes.terms, AppRoutes.privacy, AppRoutes.licenses, AppRoutes.imprint, AppRoutes.cookie]

const NO_HEADER_ROUTES = [
  AppRoutes.welcome.index,
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
  AppRoutes.welcome.survey,
  AppRoutes.spaces.createSpace,
  ...STATIC_PAGE_ROUTES,
]

// The two tabbed welcome landing pages (Workspaces + Trusted accounts) share a
// soft brand-green glow behind their content.
const WELCOME_LIST_ROUTES = [AppRoutes.welcome.accounts, AppRoutes.welcome.spaces]

const PageLayout = ({ pathname, children }: { pathname: string; children: ReactElement }): ReactElement => {
  const [isSidebarRoute, isAnimated] = useIsSidebarRoute(pathname)
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [isSidebarExpanded, setSidebarExpanded] = useState<boolean>(true)
  const [isBatchOpen, setBatchOpen] = useState<boolean>(false)
  const { txFlow, setFullWidth } = useContext(TxModalContext)
  const { BatchSidebar } = useLoadFeature(BatchingFeature)
  const { SelectSafeModal } = useLoadFeature(SpacesFeature)
  const isStaticPage = STATIC_PAGE_ROUTES.includes(pathname)
  const hideHeader = NO_HEADER_ROUTES.includes(pathname)
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(pathname)
  const isWelcomeListRoute = WELCOME_LIST_ROUTES.includes(pathname)
  const parentSafe = useParentSafe()
  const menuToggleHandler = isSidebarRoute ? setSidebarOpen : undefined

  useRouterGuard({ useGuard: useFlowActivationGuard })
  useKeyboardObserver()
  const isTopbarElevated = useIsTopbarElevated()

  // The Topbar is absolutely positioned, so the content reserves space for it via the
  // `--topbar-height` CSS var. That height is not constant: below the header's `@1100px`
  // container query the safe selector wraps onto its own row, doubling the topbar height.
  // A fixed reserve then lets the topbar overlap the page (WA: dashboard cards clipped).
  // Measure the real height and publish it so the reserve — and every other
  // `--topbar-height` consumer (AppFrame, TxModalDialog, …) — tracks it.
  // A callback ref (not an object ref + effect) so we attach the observer exactly when the
  // conditionally-rendered topbar node mounts — an object ref can still be null when a
  // static-deps effect first runs.
  const topbarObserver = useRef<ResizeObserver | null>(null)
  const topbarRef = useCallback((node: HTMLDivElement | null) => {
    topbarObserver.current?.disconnect()
    if (!node) return
    const syncHeight = () => {
      const height = Math.round(node.getBoundingClientRect().height)
      if (height > 0) document.documentElement.style.setProperty('--topbar-height', `${height}px`)
    }
    syncHeight()
    topbarObserver.current = new ResizeObserver(syncHeight)
    topbarObserver.current.observe(node)
  }, [])

  // Hide sidebar when transaction flow is open
  const isSidebarVisible = isSidebarOpen && !txFlow

  useEffect(() => {
    setFullWidth(!isSidebarVisible)
  }, [isSidebarVisible, setFullWidth])

  return (
    <>
      {isStaticPage && (
        <div className="px-6 py-4">
          <SafeLogo />
        </div>
      )}

      {isSidebarRoute ? (
        <SideDrawer isOpen={isSidebarVisible} onToggle={setSidebarOpen} onSidebarOpenChange={setSidebarExpanded} />
      ) : null}

      <div
        className={classnames(css.main, {
          [css.mainNoSidebar]: !isSidebarVisible || !isSidebarRoute,
          [css.mainAnimated]: isSidebarRoute && isAnimated,
          [css.mainNoHeader]: hideHeader,
          [css.mainSpace]: !hideHeader,
          [css.mainSidebarCollapsed]: isSidebarRoute && isSidebarVisible && !isSidebarExpanded,
        })}
      >
        {!hideHeader && (
          <div
            ref={topbarRef}
            className={classnames(css.topbar, {
              [css.topbarElevated]: isTopbarElevated,
            })}
          >
            <Topbar onMenuToggle={menuToggleHandler} onBatchToggle={setBatchOpen} />
          </div>
        )}

        <div className={classnames(css.content, { [css.welcomeGlow]: isWelcomeListRoute })}>
          <SafeLoadingError>
            {!hideHeader && parentSafe && <Breadcrumbs />}

            {isOnboardingRoute ? <div className={css.onboardingMotion}>{children}</div> : children}
          </SafeLoadingError>
        </div>

        <BatchSidebar isOpen={isBatchOpen} onToggle={setBatchOpen} />

        <Footer />
      </div>

      <SelectSafeModal />
    </>
  )
}

export default PageLayout
