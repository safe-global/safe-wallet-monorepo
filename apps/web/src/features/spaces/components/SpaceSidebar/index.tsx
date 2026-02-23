import { type ReactElement } from 'react'

import css from './styles.module.css'
import SpaceSidebarNavigation from '@/features/spaces/components/SpaceSidebarNavigation'
import SpaceSidebarSelector from '@/features/spaces/components/SpaceSidebarSelector'

const SpaceSidebar = (): ReactElement => {
  return (
    <div className={css.container}>
      <SpaceSidebarSelector />
      <SpaceSidebarNavigation />
    </div>
  )
}

export default SpaceSidebar
