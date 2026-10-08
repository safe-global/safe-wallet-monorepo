import type { ReactElement, ReactNode } from 'react'

import PageHeader from '@/components/common/PageHeader'
import css from '@/components/common/PageHeader/styles.module.css'

export type AssetsHeaderViewProps = {
  navTabs: ReactNode
  children?: ReactNode
}

export function AssetsHeaderView({ navTabs, children }: AssetsHeaderViewProps): ReactElement {
  return (
    <PageHeader
      action={
        <div className={css.pageHeader}>
          <div className={css.navWrapper}>{navTabs}</div>
          {children && <div className={css.actionsWrapper}>{children}</div>}
        </div>
      }
    />
  )
}
