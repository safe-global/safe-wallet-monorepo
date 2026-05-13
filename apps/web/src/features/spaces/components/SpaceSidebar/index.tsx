import { type ReactElement } from 'react'

import css from './styles.module.css'
import SpaceSidebarNavigation from '../SpaceSidebarNavigation'
import SpaceSidebarSelector from '../SpaceSidebarSelector'

/** @deprecated Standalone Space sidebar with no external consumers. Replaced by the unified `EnhancedSidebar` (spaces variant) in the main sidebar shell. Slated for removal. */
const SpaceSidebar = (): ReactElement => {
  return (
    <div className={css.container}>
      <SpaceSidebarSelector />
      <SpaceSidebarNavigation />
    </div>
  )
}

export default SpaceSidebar
