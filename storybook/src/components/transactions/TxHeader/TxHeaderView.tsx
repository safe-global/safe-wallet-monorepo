import type { ReactElement, ReactNode } from 'react'

import PageHeader from '@/components/common/PageHeader'
import cssPageHeader from '@/components/common/PageHeader/styles.module.css'
import css from './styles.module.css'

export type TxHeaderViewProps = {
  navigation: ReactNode
  children?: ReactNode
}

export const TxHeaderView = ({ navigation, children }: TxHeaderViewProps): ReactElement => {
  return (
    <PageHeader
      action={
        <div className={cssPageHeader.pageHeader}>
          <div className={cssPageHeader.navWrapper}>{navigation}</div>
          {children && <div className={`${cssPageHeader.actionsWrapper} ${css.actionsWrapper}`}>{children}</div>}
        </div>
      }
    />
  )
}
