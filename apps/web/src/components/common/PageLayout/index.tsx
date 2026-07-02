import { useContext, useEffect, useState, type ReactElement } from 'react'
import classnames from 'classnames'
import Topbar from '@/components/common/Header/Topbar'
import SafeLogo from '@/components/common/SafeLogo'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
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
import { useIsSignedIn } from '@/hooks/useIsSignedIn'

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

const PageLayout = ({ pathname, children }: { pathname: string; children: ReactElement }): ReactElement => {
  const [isSidebarRoute, isAnimated] = useIsSidebarRoute(pathname)
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [isSpacesSidebarExpanded, setSpacesSidebarExpanded] = useState<boolean>(true)
  const [isBatchOpen, setBatchOpen] = useState<boolean>(false)
  const { txFlow, setFullWidth } = useContext(TxModalContext)
  const { BatchSidebar } = useLoadFeature(BatchingFeature)
  const { SelectSafeModal } = useLoadFeature(SpacesFeature)
  const isStaticPage = STATIC_PAGE_ROUTES.includes(pathname)
  const isSignedIn = useIsSignedIn()
  const isWelcomeWorskpacePage = pathname === AppRoutes.welcome.spaces
  const hideHeader = NO_HEADER_ROUTES.includes(pathname) || (isWelcomeWorskpacePage && !isSignedIn)
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(pathname)
  const isSpaceRoute = useIsSpaceRoute()
  const parentSafe = useParentSafe()
  const menuToggleHandler = isSidebarRoute ? setSidebarOpen : undefined

  useRouterGuard({ useGuard: useFlowActivationGuard })
  useKeyboardObserver()
  const isTopbarElevated = useIsTopbarElevated()

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

      {/* The welcome tabs hide the Topbar while signed out — keep the Safe logo visible top-left. */}
      {(isWelcomeWorskpacePage || isWelcomeAccountsPage) && !isSignedIn && (
        <div className="absolute left-6 top-4 z-10">
          <SafeLogo data-testid="welcome-safe-logo" />
        </div>
      )}

      {isSidebarRoute ? (
        <SideDrawer
          isOpen={isSidebarVisible}
          onToggle={setSidebarOpen}
          onSidebarOpenChange={isSpaceRoute ? setSpacesSidebarExpanded : undefined}
        />
      ) : null}

      <div
        className={classnames(css.main, {
          [css.mainNoSidebar]: !isSidebarVisible || !isSidebarRoute,
          [css.mainAnimated]: isSidebarRoute && isAnimated,
          [css.mainNoHeader]: hideHeader,
          [css.mainSpace]: !hideHeader,
          [css.mainSpaceCollapsed]: isSpaceRoute && !isSpacesSidebarExpanded,
        })}
      >
        {!hideHeader && (
          <div
            className={classnames(css.topbar, {
              [css.topbarElevated]: isTopbarElevated,
            })}
          >
            <Topbar onMenuToggle={menuToggleHandler} onBatchToggle={setBatchOpen} />
          </div>
        )}

        <div className={css.content}>
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
