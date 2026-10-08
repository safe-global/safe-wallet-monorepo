import type { ReactElement, ReactNode } from 'react'
import { TxListView } from '@views/components/transactions/TxList/TxListView'

import labelCss from '@/components/transactions/GroupLabel/styles.module.css'

export type RecoveryListViewProps = {
  list: ReactNode
}

export function RecoveryListView({ list }: RecoveryListViewProps): ReactElement {
  return (
    <>
      <div className={labelCss.container}>Pending recovery</div>

      <TxListView>{list}</TxListView>
    </>
  )
}
