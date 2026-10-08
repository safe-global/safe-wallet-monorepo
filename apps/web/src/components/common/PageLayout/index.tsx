import { useContext, useEffect, useState, type ReactElement } from 'react'
import Topbar from '@/components/common/Header/Topbar'
import SafeLogo from '@/components/common/SafeLogo'
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
import { useIsTopbarElevated, useIsTopbarAboveOverlay } from '@/hooks/useTopbarElevation'
import { useCssHeightVar } from '@/hooks/useCssHeightVar'
import { PageLayoutView } from '@views/components/common/PageLayout/PageLayoutView'

const ONBOARDING_ROUTES = [
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
  AppRoutes.welcome.survey,
]

const STATIC_PAGE_ROUTES = [AppRoutes.licenses, AppRoutes.imprint, AppRoutes.cookie]

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
  const { SelectSafeModal, SafeWorkspaceSignInDialog } = useLoadFeature(SpacesFeature)
  const isStaticPage = STATIC_PAGE_ROUTES.includes(pathname)
  const hideHeader = NO_HEADER_ROUTES.includes(pathname)
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(pathname)
  const isWelcomeListRoute = WELCOME_LIST_ROUTES.includes(pathname)
  const parentSafe = useParentSafe()
  const menuToggleHandler = isSidebarRoute ? setSidebarOpen : undefined

  useRouterGuard({ useGuard: useFlowActivationGuard })
  useKeyboardObserver()
  const isTopbarElevated = useIsTopbarElevated()
  const isTopbarAboveOverlay = useIsTopbarAboveOverlay()
  // The Topbar is absolutely positioned, so the content reserves space for it via the
  // `--topbar-height` CSS var. That height is not constant: below the header's `@1100px`
  // container query the safe selector wraps onto its own row, doubling the topbar height.
  // A fixed reserve then lets the topbar overlap the page (WA: dashboard cards clipped).
  const setTopbarNode = useCssHeightVar('--topbar-height')

  // Hide sidebar when transaction flow is open
  const isSidebarVisible = isSidebarOpen && !txFlow

  useEffect(() => {
    setFullWidth(!isSidebarVisible)
  }, [isSidebarVisible, setFullWidth])

  return (
    <>
      <PageLayoutView
        isStaticPage={isStaticPage}
        logo={<SafeLogo />}
        sideDrawer={
          isSidebarRoute ? (
            <SideDrawer
              isOpen={isSidebarVisible}
              onToggle={setSidebarOpen}
              onSidebarOpenChange={setSidebarExpanded}
              isSidebarExpanded={isSidebarExpanded}
            />
          ) : null
        }
        isSidebarRoute={isSidebarRoute}
        isSidebarVisible={isSidebarVisible}
        isSidebarExpanded={isSidebarExpanded}
        isAnimated={isAnimated}
        hideHeader={hideHeader}
        topbarRef={setTopbarNode}
        isTopbarElevated={isTopbarElevated}
        isTopbarAboveOverlay={isTopbarAboveOverlay}
        topbar={<Topbar onMenuToggle={menuToggleHandler} onBatchToggle={setBatchOpen} />}
        isWelcomeListRoute={isWelcomeListRoute}
        isOnboardingRoute={isOnboardingRoute}
        breadcrumbs={parentSafe && <Breadcrumbs />}
        wrapContent={(content) => <SafeLoadingError>{content}</SafeLoadingError>}
        batchSidebar={<BatchSidebar isOpen={isBatchOpen} onToggle={setBatchOpen} />}
        footer={<Footer />}
      >
        {children}
      </PageLayoutView>

      <SelectSafeModal />
      <SafeWorkspaceSignInDialog />
    </>
  )
}

export default PageLayout
