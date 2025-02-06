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
import { useIsOrganisationRoute } from '@/hooks/useIsOrganisationRoute'
import OrganisationSidebar from '@/features/organisations/components/OrgSidebar'

const PageLayout = ({ pathname, children }: { pathname: string; children: ReactElement }): ReactElement => {
  const [isSidebarRoute, isAnimated] = useIsSidebarRoute(pathname)
  const isOrganisationRoute = useIsOrganisationRoute(pathname)
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [isBatchOpen, setBatchOpen] = useState<boolean>(false)
  const { setFullWidth } = useContext(TxModalContext)

  useEffect(() => {
    setFullWidth(!isSidebarOpen)
  }, [isSidebarOpen, setFullWidth])

  return (
    <>
      <header className={css.header}>
        <Header onMenuToggle={isSidebarRoute ? setSidebarOpen : undefined} onBatchToggle={setBatchOpen} />
      </header>

      {isSidebarRoute && <SideDrawer isOpen={isSidebarOpen} onToggle={setSidebarOpen} />}
      {isOrganisationRoute && <OrganisationSidebar />}

      <div
        className={classnames(css.main, {
          [css.mainNoSidebar]: (!isSidebarOpen || !isSidebarRoute) && !isOrganisationRoute,
          [css.mainAnimated]: isSidebarRoute && isAnimated,
        })}
      >
        <div className={css.content}>
          <SafeLoadingError>{children}</SafeLoadingError>
        </div>

        <BatchSidebar isOpen={isBatchOpen} onToggle={setBatchOpen} />

        <Footer />
      </div>
    </>
  )
}

export default PageLayout
