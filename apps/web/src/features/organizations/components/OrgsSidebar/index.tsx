import { type ReactElement } from 'react'

import css from './styles.module.css'
import { Drawer } from '@mui/material'
import OrgsSidebarNavigation from '@/features/organizations/components/OrgsSidebarNavigation'
import OrgsSidebarSelector from '../OrgsSidebarSelector'

const OrgsSidebar = (): ReactElement => {
  return (
    <Drawer variant="permanent" anchor="left">
      <div className={css.container}>
        <OrgsSidebarSelector />
        <OrgsSidebarNavigation />
      </div>
    </Drawer>
  )
}

export default OrgsSidebar
