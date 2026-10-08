import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useContext } from 'react'
import type { PropsWithChildren, ReactElement } from 'react'

import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { getRecoverySkipTransaction } from '../../services/transaction'
import { createTx } from '@/services/tx/tx-sender'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import useAsync from '@safe-global/utils/hooks/useAsync'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { CancelRecoveryReviewView } from '@views/features/recovery/components/CancelRecoveryReview/CancelRecoveryReviewView'

function CancelRecoveryReview({
  recovery,
  onSubmit,
  children,
}: PropsWithChildren<{
  recovery: RecoveryQueueItem
  onSubmit: () => void
}>): ReactElement {
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
    <ReviewTransaction onSubmit={handleSubmit}>
      <CancelRecoveryReviewView isMalicious={recovery.isMalicious}>{children}</CancelRecoveryReviewView>
    </ReviewTransaction>
  )
}

export default CancelRecoveryReview
