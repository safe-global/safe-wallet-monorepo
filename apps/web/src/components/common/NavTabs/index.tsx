import React from 'react'
import NextLink from 'next/link'
import { Tab, Tabs, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import type { NavItem } from '@/components/sidebar/SidebarNavigation/config'
import css from './styles.module.css'

const NavTabs = ({ tabs }: { tabs: NavItem[] }) => {
  const router = useRouter()
  const activeTab = Math.max(0, tabs.map((tab) => tab.href).indexOf(router.pathname))
  const query = router.query.safe ? { safe: router.query.safe } : undefined

  return (
    <Tabs value={activeTab} variant="scrollable" allowScrollButtonsMobile className={css.tabs}>
      {tabs.map((tab, idx) => (
        <Tab
          key={tab.href}
          href={{ pathname: tab.href, query }}
          component={NextLink}
          tabIndex={0}
          className={css.tab}
          label={
            <Typography
              variant="body2"
              fontWeight={700}
              color={activeTab === idx ? 'primary' : 'primary.light'}
              className={css.label}
            >
              {tab.label}
            </Typography>
          }
        />
      ))}
    </Tabs>
  )
}

export default NavTabs
