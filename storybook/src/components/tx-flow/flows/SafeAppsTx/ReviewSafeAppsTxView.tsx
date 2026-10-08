import type { ReactElement } from 'react'
import ErrorMessage from '@/components/tx/ErrorMessage'

export type ReviewSafeAppsTxViewProps = {
  error: boolean
  safeTxError?: Error
}

export const ReviewSafeAppsTxView = ({ error, safeTxError }: ReviewSafeAppsTxViewProps): ReactElement | null =>
  error ? (
    <ErrorMessage error={safeTxError}>
      This Safe App initiated a transaction which cannot be processed. Please get in touch with the developer of this
      Safe App for more information.
    </ErrorMessage>
  ) : null
