import { useEffect, useState, type ReactElement } from 'react'
import cn from 'classnames'
import { Drawer } from '@mui/material'
import { useRouter } from 'next/router'

import Sidebar from '@/components/sidebar/Sidebar'
import Header from '@/components/common//Header'
import css from './styles.module.css'
import SafeLoadingError from '../SafeLoadingError'
import Footer from '../Footer'
import { AppRoutes } from '@/config/routes'

const PageLayout = ({ children }: { children: ReactElement }): ReactElement => {
  const router = useRouter()
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false)
  const hideSidebar = router.pathname === AppRoutes.share.safeApp

  const onMenuToggle = (): void => {
    setIsMobileDrawerOpen((prev) => !prev)
  }

  const sidebar = <Sidebar />

  useEffect(() => {
    setIsMobileDrawerOpen(false)
  }, [router.pathname, router.query.safe])

  return (
    <>
      <header className={css.header}>
        <Header onMenuToggle={onMenuToggle} />
      </header>

      {/* Desktop sidebar */}
      {!hideSidebar && <aside className={css.sidebar}>{sidebar}</aside>}

      {/* Mobile sidebar */}
      <Drawer variant="temporary" anchor="left" open={isMobileDrawerOpen} onClose={onMenuToggle}>
        {sidebar}
      </Drawer>

      <div className={cn(css.main, hideSidebar && css.mainNoSidebar)}>
        <div className={css.content}>
          <SafeLoadingError>{children}</SafeLoadingError>
        </div>

        <Footer />
      </div>
    </>
  )
}

export default PageLayout
