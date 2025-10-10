import { useContext, useEffect, useState, type ReactElement } from 'react'
import classnames from 'classnames'

import Header from '@/components/common/Header'
import css from './styles.module.css'
import SafeLoadingError from '../SafeLoadingError'
import Footer from '../Footer'
import SideDrawer from './SideDrawer'
import { useIsSidebarRoute } from '@/hooks/useIsSidebarRoute'
import { TxModalContext } from '@/components/tx-flow'
import BatchSidebar from '@/components/batch/BatchSidebar'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { AppRoutes } from '@/config/routes'

const PageLayout = ({ pathname, children }: { pathname: string; children: ReactElement }): ReactElement => {
  const [isSidebarRoute, isAnimated] = useIsSidebarRoute(pathname)
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [isBatchOpen, setBatchOpen] = useState<boolean>(false)
  const { setFullWidth } = useContext(TxModalContext)
  const isWelcomePage = pathname === AppRoutes.welcome.index
  const isSafeLabsTermsPage = pathname === AppRoutes.safeLabsTerms
  const hideHeader = isWelcomePage || isSafeLabsTermsPage

  useEffect(() => {
    setFullWidth(!isSidebarOpen)
  }, [isSidebarOpen, setFullWidth])

  return (
    <>
      {!hideHeader && (
        <header className={css.header}>
          <Header onMenuToggle={isSidebarRoute ? setSidebarOpen : undefined} onBatchToggle={setBatchOpen} />
        </header>
      )}

      {isSidebarRoute ? <SideDrawer isOpen={isSidebarOpen} onToggle={setSidebarOpen} /> : null}

      <div
        className={classnames(css.main, {
          [css.mainNoSidebar]: !isSidebarOpen || !isSidebarRoute,
          [css.mainAnimated]: isSidebarRoute && isAnimated,
          [css.mainNoHeader]: hideHeader,
        })}
      >
        <div className={css.content}>
          <SafeLoadingError>
            {!hideHeader && <Breadcrumbs />}
            {children}
          </SafeLoadingError>
        </div>

        <BatchSidebar isOpen={isBatchOpen} onToggle={setBatchOpen} />

        {!isSafeLabsTermsPage && <Footer />}
      </div>
    </>
  )
}

export default PageLayout
