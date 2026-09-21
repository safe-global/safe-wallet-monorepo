import { useContext } from 'react'
import type { ReactElement } from 'react'

import TxCheckError from '@/components/tx/TxCheckError'
import TxSubmitError from '@/components/tx/TxSubmitError'
import { useIsValidRecoveryExecuteNextTx, useIsValidRecoverySkipExpired } from '../../hooks/useIsValidRecoveryExecution'
import { RecoveryListItemContext } from '../RecoveryListItem/RecoveryListItemContext'
import type { RecoveryQueueItem } from '../../services/recovery-state'

export default function RecoveryValidationErrors({ item }: { item: RecoveryQueueItem }): ReactElement | null {
  const { submitError } = useContext(RecoveryListItemContext)
  const [, executeNextTxError] = useIsValidRecoveryExecuteNextTx(item)
  const [, executeSkipExpiredError] = useIsValidRecoverySkipExpired(item)

  // There can never be both errors as they are dependent on validity/expiration
  const validationError = executeNextTxError ?? executeSkipExpiredError

  if (!submitError && !validationError) {
    return null
  }

  return (
    <>
      {validationError && <TxCheckError error={validationError} />}

      {submitError && <TxSubmitError error={submitError} />}
    </>
  )
}
