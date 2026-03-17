import { useContext, useEffect, useState, type ReactElement } from 'react'
import classnames from 'classnames'
import { AnimatePresence, motion } from 'motion/react'

import Topbar from '@/components/common/Header/Topbar'
import Header from '@/components/common/Header'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import css from './styles.module.css'
import SafeLoadingError from '../SafeLoadingError'
import Footer from '../Footer'
import SideDrawer from './SideDrawer'
import { useIsSidebarRoute } from '@/hooks/useIsSidebarRoute'
import { TxModalContext } from '@/components/tx-flow'
import { useLoadFeature } from '@/features/__core__'
import { BatchingFeature } from '@/features/batching'
import { AppRoutes } from '@/config/routes'
import SpaceSafeBar from '@/components/common/SpaceSafeBar'
import { useRouterGuard } from '@/hooks/useRouterGuard'
import { useFlowActivationGuard } from '@/hooks/useRouterGuard/activationGuards/useFlowActivationGuard'

const ONBOARDING_ROUTES = [
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
]

const NO_HEADER_ROUTES = [
  AppRoutes.safeLabsTerms,
  AppRoutes.welcome.index,
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
  AppRoutes.spaces.createSpace,
]

const PageLayout = ({ pathname, children }: { pathname: string; children: ReactElement }): ReactElement => {
  const [isSidebarRoute, isAnimated] = useIsSidebarRoute(pathname)
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [isBatchOpen, setBatchOpen] = useState<boolean>(false)
  const { txFlow, setFullWidth } = useContext(TxModalContext)
  const { BatchSidebar } = useLoadFeature(BatchingFeature)
  const isSafeLabsTermsPage = pathname === AppRoutes.safeLabsTerms
  const hideHeader = NO_HEADER_ROUTES.includes(pathname)
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(pathname)
  const isSpaceRoute = useIsSpaceRoute()
  const menuToggleHandler = isSidebarRoute ? setSidebarOpen : undefined

  useRouterGuard({ useGuard: useFlowActivationGuard })

  // Hide sidebar when transaction flow is open
  const isSidebarVisible = isSidebarOpen && !txFlow

  useEffect(() => {
    setFullWidth(!isSidebarVisible)
  }, [isSidebarVisible, setFullWidth])

  const mainContent = (
    <div
      className={classnames(css.main, {
        [css.mainNoSidebar]: !isSidebarVisible || !isSidebarRoute,
        [css.mainAnimated]: isSidebarRoute && isAnimated,
        [css.mainNoHeader]: hideHeader,
        [css.mainSpace]: isSpaceRoute,
      })}
    >
      <div className={css.content}>
        <SafeLoadingError>
          {!hideHeader && !isSpaceRoute && <SpaceSafeBar />}
          {isOnboardingRoute ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeInOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
            children
          )}
        </SafeLoadingError>
      </div>

      <BatchSidebar isOpen={isBatchOpen} onToggle={setBatchOpen} />

      {!isSafeLabsTermsPage && <Footer />}
    </div>
  )

  if (isSpaceRoute) {
    return (
      <div className={css.spaceLayout}>
        {isSidebarRoute ? <SideDrawer isOpen={isSidebarVisible} onToggle={setSidebarOpen} /> : null}

        <div className={css.spaceMain}>
          {!hideHeader && <Topbar onMenuToggle={menuToggleHandler} />}
          {mainContent}
        </div>
      </div>
    )
  }

  return (
    <>
      {!hideHeader && (
        <header className={css.header}>
          <Header onMenuToggle={menuToggleHandler} onBatchToggle={setBatchOpen} />
        </header>
      )}

      {isSidebarRoute ? <SideDrawer isOpen={isSidebarVisible} onToggle={setSidebarOpen} /> : null}

      {mainContent}
    </>
  )
}

export default PageLayout
