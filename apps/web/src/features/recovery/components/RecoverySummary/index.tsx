import type { ReactElement } from 'react'

import RecoveryType from '../RecoveryType'
import RecoveryInfo from '../RecoveryInfo'
import RecoveryStatus from '../RecoveryStatus'
import ExecuteRecoveryButton from '../ExecuteRecoveryButton'
import useWallet from '@/hooks/wallets/useWallet'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import css from '@/components/transactions/TxSummary/styles.module.css'
import { useRecoveryTxState } from '@/features/recovery/hooks/useRecoveryTxState'
import DateTime from '@/components/common/DateTime'

export default function RecoverySummary({ item }: { item: RecoveryQueueItem }): ReactElement {
  const wallet = useWallet()
  const { isExecutable, isPending } = useRecoveryTxState(item)
  const { isMalicious } = item

  return (
    <div className={css.gridContainer}>
      <div style={{ gridArea: 'type' }}>
        <RecoveryType isMalicious={isMalicious} />
      </div>

      <div style={{ gridArea: 'info' }}>
        <RecoveryInfo isMalicious={isMalicious} />
      </div>

      <div style={{ gridArea: 'date' }} data-testid="tx-date" className={css.date}>
        <DateTime value={Number(item.timestamp)} />
      </div>

      {!isExecutable || isPending ? (
        <div style={{ gridArea: 'status' }}>
          <RecoveryStatus recovery={item} />
        </div>
      ) : (
        <div style={{ gridArea: 'actions' }} className="mr-4 flex justify-center">
          {!isMalicious && wallet && <ExecuteRecoveryButton recovery={item} compact />}
        </div>
      )}
    </div>
  )
}
