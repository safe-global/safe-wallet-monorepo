import type { ReactElement, ReactNode } from 'react'
import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxSubmitError from '@/components/tx/TxSubmitError'

export type ComboSubmitViewProps = {
  submitError?: Error
  isRejectedByUser: boolean
  validationError?: Error
  showLastSignerWarning: boolean
  slot: ReactNode
}

export const ComboSubmitView = ({
  submitError,
  isRejectedByUser,
  validationError,
  showLastSignerWarning,
  slot,
}: ComboSubmitViewProps): ReactElement => {
  return (
    <>
      {submitError && (
        <div className="mt-2">
          <TxSubmitError error={submitError} context="execution" />
        </div>
      )}

      {isRejectedByUser && (
        <div className="mt-2">
          <WalletRejectionError />
        </div>
      )}

      {validationError !== undefined && <ErrorMessage error={validationError}>{validationError.message}</ErrorMessage>}

      {showLastSignerWarning && (
        <div className="mt-2">
          <ErrorMessage level="info">
            You&apos;re providing the last signature. After you sign, anyone can execute this transaction.
          </ErrorMessage>
        </div>
      )}

      {slot}
    </>
  )
}
