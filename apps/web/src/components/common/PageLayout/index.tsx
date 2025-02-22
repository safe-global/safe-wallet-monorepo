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
import { Alert, AlertTitle, Typography } from '@mui/material'
import { DisableWrapper } from '@/components/wrappers/DisableWrapper'
import MUILink from '@mui/material/Link'
import Link from 'next/link'
import { OpenInNew } from '@mui/icons-material'
import { HelpCenterArticle, X_URL } from '@/config/constants'

const PageLayout = ({ pathname, children }: { pathname: string; children: ReactElement }): ReactElement => {
  const [isSidebarRoute, isAnimated] = useIsSidebarRoute(pathname)
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

      <div
        className={classnames(css.main, {
          [css.mainNoSidebar]: !isSidebarOpen || !isSidebarRoute,
          [css.mainAnimated]: isSidebarRoute && isAnimated,
        })}
      >
        <div className={css.content}>
          <DisableWrapper
            message={
              <Alert severity="warning" style={{ margin: 20 }}>
                <AlertTitle>
                  <Typography>Important notice.</Typography>
                </AlertTitle>
                Safe{'{'}Wallet{'}'} is working on a phased system restoration. Users now have access to Safe Accounts
                in read-only. You can use the{' '}
                <Link href={HelpCenterArticle.SAFE_CLI} target="_blank">
                  <MUILink>Safe CLI</MUILink>
                </Link>{' '}
                to transact with your Safe Account onchain. <br />
                <MUILink href={X_URL} target="_blank" style={{ display: 'flex', alignItems: 'center' }}>
                  Check X for updates <OpenInNew fontSize="small" color="primary" />
                </MUILink>
              </Alert>
            }
          >
            {null}
          </DisableWrapper>

          <SafeLoadingError>{children}</SafeLoadingError>
        </div>

        <BatchSidebar isOpen={isBatchOpen} onToggle={setBatchOpen} />

        <Footer />
      </div>
    </>
  )
}

export default PageLayout
