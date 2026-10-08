import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import ErrorMessage from '@/components/tx/ErrorMessage'

export type CancelRecoveryReviewViewProps = {
  isMalicious: boolean
  children?: ReactNode
}

export const CancelRecoveryReviewView = ({ isMalicious, children }: CancelRecoveryReviewViewProps) => {
  return (
    <>
      <Typography className="mb-2">
        All actions initiated by the Recoverer will be cancelled. The current signers will remain the signers of the
        Safe account.
      </Typography>

      <ErrorMessage level="info">
        This transaction will initiate the cancellation of the{' '}
        {isMalicious ? 'malicious transaction' : 'recovery proposal'}. It requires other signer signatures in order to
        be executed.
      </ErrorMessage>

      {children}
    </>
  )
}
