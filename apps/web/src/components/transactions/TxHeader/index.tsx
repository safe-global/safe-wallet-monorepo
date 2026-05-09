import type { ReactElement, ReactNode } from 'react'

import PageHeader from '@/components/common/PageHeader'
import cssPageHeader from '@/components/common/PageHeader/styles.module.css'
import css from './styles.module.css'
import TxNavigation from '@/components/transactions/TxNavigation'

const TxHeader = ({ children }: { children?: ReactNode }): ReactElement => {
  return (
    <PageHeader
      action={
        <div className={cssPageHeader.pageHeader}>
          <div className={cssPageHeader.navWrapper}>
            <TxNavigation />
          </div>
          {children && <div className={`${cssPageHeader.actionsWrapper} ${css.actionsWrapper}`}>{children}</div>}
        </div>
      }
    />
  )
}

export default TxHeader
