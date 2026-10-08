import type { ReactElement, ReactNode } from 'react'

import RecoveryType from '@views/features/recovery/components/RecoveryType'
import RecoveryInfo from '@views/features/recovery/components/RecoveryInfo'
import classNames from 'classnames'
import css from '@/components/transactions/TxSummary/styles.module.css'

export type RecoverySummaryViewProps = {
  isMalicious: boolean
  showStatus: boolean
  showExecuteButton: boolean
  date: ReactNode
  status: ReactNode
  executeButton: ReactNode
}

export function RecoverySummaryView({
  isMalicious,
  showStatus,
  showExecuteButton,
  date,
  status,
  executeButton,
}: RecoverySummaryViewProps): ReactElement {
  return (
    <div data-testid="transaction-item" className={classNames(css.gridContainer, css.queue, css.recovery)}>
      <div className={css.type} style={{ gridArea: 'type' }}>
        <RecoveryType isMalicious={isMalicious} />
      </div>

      <div className={css.info} style={{ gridArea: 'info' }}>
        <RecoveryInfo isMalicious={isMalicious} />
      </div>

      <div style={{ gridArea: 'date' }} data-testid="tx-date" className={css.date}>
        {date}
      </div>

      <div className={css.actions} style={{ gridArea: 'actions' }}>
        {showStatus ? status : <div data-testid="tx-actions">{showExecuteButton && executeButton}</div>}
      </div>
    </div>
  )
}
