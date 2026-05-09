import { Box } from '@mui/material'
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
    <Box className={css.gridContainer}>
      <Box gridArea="type">
        <RecoveryType isMalicious={isMalicious} />
      </Box>

      <Box gridArea="info">
        <RecoveryInfo isMalicious={isMalicious} />
      </Box>

      <Box gridArea="date" data-testid="tx-date" className={css.date}>
        <DateTime value={Number(item.timestamp)} />
      </Box>

      {!isExecutable || isPending ? (
        <Box gridArea="status">
          <RecoveryStatus recovery={item} />
        </Box>
      ) : (
        <Box gridArea="actions" mr={2} display="flex" justifyContent="center">
          {!isMalicious && wallet && <ExecuteRecoveryButton recovery={item} compact />}
        </Box>
      )}
    </Box>
  )
}
