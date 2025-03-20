import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Typography } from '@mui/material'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import { SafeTxContext } from '../../SafeTxProvider'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { getRecoverySkipTransaction } from '@/features/recovery/services/transaction'
import { createTx } from '@/services/tx/tx-sender'
import ErrorMessage from '@/components/tx/ErrorMessage'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import useAsync from '@/hooks/useAsync'
import ReviewTransaction from '@/components/tx/ReviewTransaction'

export function CancelRecoveryFlowReview({
  recovery,
  onSubmit,
}: {
  recovery: RecoveryQueueItem
  onSubmit: () => void
}): ReactElement {
  const web3ReadOnly = useWeb3ReadOnly()
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useAsync(async () => {
    if (!web3ReadOnly) {
      return
    }
    const transaction = await getRecoverySkipTransaction(recovery, web3ReadOnly)
    createTx(transaction).then(setSafeTx).catch(setSafeTxError)
  }, [setSafeTx, setSafeTxError, recovery, web3ReadOnly])

  const handleSubmit = () => {
    trackEvent({ ...RECOVERY_EVENTS.SUBMIT_RECOVERY_CANCEL })
    onSubmit()
  }

  return (
    <ReviewTransaction onSubmit={handleSubmit} isBatchable={false}>
      <Typography mb={1}>
        All actions initiated by the Recoverer will be cancelled. The current signers will remain the signers of the
        Safe Account.
      </Typography>

      <ErrorMessage level="info">
        This transaction will initiate the cancellation of the{' '}
        {recovery.isMalicious ? 'malicious transaction' : 'recovery proposal'}. It requires other signer signatures in
        order to be executed.
      </ErrorMessage>
    </ReviewTransaction>
  )
}
