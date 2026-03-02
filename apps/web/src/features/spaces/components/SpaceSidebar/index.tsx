import { type ReactElement } from 'react'

import css from './styles.module.css'
import SpaceSidebarNavigation from '../SpaceSidebarNavigation'
import SpaceSidebarSelector from '../SpaceSidebarSelector'

const SpaceSidebar = (): ReactElement => {
  return (
    <div className={css.container}>
      <SpaceSidebarSelector />
      <SpaceSidebarNavigation />
    </div>
  )
}

export default SpaceSidebar
