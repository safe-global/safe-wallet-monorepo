import { useContext } from 'react'
import type { ReactElement } from 'react'

import ErrorMessage from '@/components/tx/ErrorMessage'
import { useIsValidRecoveryExecuteNextTx, useIsValidRecoverySkipExpired } from '@/hooks/useIsValidRecoveryExecution'
import { RecoveryListItemContext } from '../RecoveryListItem/RecoveryListItemContext'
import type { RecoveryQueueItem } from '@/services/recovery/recovery-state'

export function RecoveryValidationErrors({ item }: { item: RecoveryQueueItem }): ReactElement | null {
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
      {validationError && (
        <ErrorMessage error={validationError}>
          This transaction will most likely fail. To save gas costs, avoid executing the transaction.
        </ErrorMessage>
      )}

      {submitError && (
        <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
      )}
    </>
  )
}
