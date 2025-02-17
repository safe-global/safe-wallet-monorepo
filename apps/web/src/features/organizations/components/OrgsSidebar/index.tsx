import { type ReactElement } from 'react'

import css from './styles.module.css'
import OrgsSidebarNavigation from '@/features/organizations/components/OrgsSidebarNavigation'
import OrgsSidebarSelector from '../OrgsSidebarSelector'

const OrgsSidebar = (): ReactElement => {
  return (
    <div className={css.container}>
      <OrgsSidebarSelector />
      <OrgsSidebarNavigation />
    </div>
  )
}

export default OrgsSidebar
