import { Alert, Box } from '@mui/material'
import type { ReactElement } from 'react'

import { AuditRow, AuditLogHeader } from '@/components/common/AuditLog'
import { Countdown } from '@/components/common/Countdown'
import ExecuteRecoveryButton from '../ExecuteRecoveryButton'
import CancelRecoveryButton from '../CancelRecoveryButton'
import { useRecoveryTxState } from '../../hooks/useRecoveryTxState'
import { formatAuditDateTime } from '@/components/common/AuditLog'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import useAddressBook from '@/hooks/useAddressBook'

export default function RecoverySigners({ item }: { item: RecoveryQueueItem }): ReactElement {
  const { isExecutable, isExpired, isNext, remainingSeconds } = useRecoveryTxState(item)
  const addressBook = useAddressBook()

  const executionLabel = isExpired ? 'Expired' : isExecutable ? 'Executable' : 'Waiting'
  const executionActionType = isExpired ? 'expired' : isExecutable ? 'executed' : 'pending'

  const expiresAtFormatted = item.expiresAt !== null ? formatAuditDateTime(Number(item.expiresAt)) : null

  const desc = isExecutable
    ? expiresAtFormatted
      ? `The recovery proposal can be executed until ${expiresAtFormatted}.`
      : 'The recovery proposal can be executed now.'
    : isExpired
      ? 'The recovery proposal has expired and needs to be cancelled before a new one can be created.'
      : 'The recovery proposal can be executed after the review window has passed.'

  return (
    <>
      <Box>
        <AuditLogHeader />

        <AuditRow
          label="Created"
          actionType="created"
          address={item.executor}
          name={addressBook[item.executor]}
          timestamp={Number(item.timestamp)}
        />

        <AuditRow label={executionLabel} actionType={executionActionType} isLast />

        <Alert severity={isExpired ? 'warning' : 'info'} sx={{ mt: 2, py: 0.5 }}>
          {desc}
        </Alert>

        {isNext && remainingSeconds > 0 && (
          <Box mt={2}>
            <Countdown seconds={remainingSeconds} />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <ExecuteRecoveryButton recovery={item} />
        <CancelRecoveryButton recovery={item} />
      </Box>
    </>
  )
}
