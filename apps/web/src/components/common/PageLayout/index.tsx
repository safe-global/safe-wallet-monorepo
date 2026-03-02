import { useContext, useEffect, useState, type ReactElement } from 'react'
import classnames from 'classnames'
import { AnimatePresence, motion } from 'motion/react'

import Topbar from '@/components/common/Header/Topbar'
import css from './styles.module.css'
import SafeLoadingError from '../SafeLoadingError'
import Footer from '../Footer'
import SideDrawer from './SideDrawer'
import { useIsSidebarRoute } from '@/hooks/useIsSidebarRoute'
import { TxModalContext } from '@/components/tx-flow'
import BatchSidebar from '@/components/batch/BatchSidebar'
import { AppRoutes } from '@/config/routes'
import { useRouterGuard } from '@/hooks/useRouterGuard'
import { useFlowActivationGuard } from '@/hooks/useRouterGuard/activationGuards/useFlowActivationGuard'

const ONBOARDING_ROUTES = [
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
  AppRoutes.welcome.addressBook,
]

const NO_HEADER_ROUTES = [
  AppRoutes.safeLabsTerms,
  AppRoutes.welcome.index,
  AppRoutes.welcome.createSpace,
  AppRoutes.welcome.selectSafes,
  AppRoutes.welcome.inviteMembers,
  AppRoutes.welcome.addressBook,
  AppRoutes.spaces.createSpace,
]

const PageLayout = ({ pathname, children }: { pathname: string; children: ReactElement }): ReactElement => {
  const [isSidebarRoute, isAnimated] = useIsSidebarRoute(pathname)
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [isBatchOpen, setBatchOpen] = useState<boolean>(false)
  const { txFlow, setFullWidth } = useContext(TxModalContext)
  const isSafeLabsTermsPage = pathname === AppRoutes.safeLabsTerms
  const hideHeader = NO_HEADER_ROUTES.includes(pathname)
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(pathname)

  useRouterGuard({ useGuard: useFlowActivationGuard })

  // Hide sidebar when transaction flow is open
  const isSidebarVisible = isSidebarOpen && !txFlow

  useEffect(() => {
    setFullWidth(!isSidebarVisible)
  }, [isSidebarVisible, setFullWidth])

  return (
    <>
      {isSidebarRoute ? <SideDrawer isOpen={isSidebarVisible} onToggle={setSidebarOpen} /> : null}

      <div
        className={classnames(css.main, {
          [css.mainNoSidebar]: !isSidebarVisible || !isSidebarRoute,
          [css.mainAnimated]: isSidebarRoute && isAnimated,
          [css.mainNoHeader]: hideHeader,
        })}
      >
        {!hideHeader && <Topbar />}
        <div className={css.content}>
          <SafeLoadingError>
            {/* Disabled breadcrumbs for now */}
            {/* {!hideHeader && <Breadcrumbs />}  */}
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
    </>
  )
}

export default PageLayout
