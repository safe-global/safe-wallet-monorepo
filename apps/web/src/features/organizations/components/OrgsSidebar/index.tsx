import { type ReactElement } from 'react'

import css from './styles.module.css'
import { Drawer } from '@mui/material'
import OrgsSidebarNavigation from '@/features/organizations/components/OrgsSidebarNavigation'

const OrgsSidebar = (): ReactElement => {
  return (
    <Drawer variant="permanent" anchor="left">
      <div className={css.container}>
        <OrgsSidebarNavigation />
      </div>
    </Drawer>
  )
}

export default OrgsSidebar
