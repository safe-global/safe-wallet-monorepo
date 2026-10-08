import { useContext, useEffect } from 'react'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import BatchIcon from '@/public/images/common/batch.svg'
import { useDraftBatch } from '@/features/batching'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { CONFIRM_BATCH_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/ConfirmBatch/copy'

type ConfirmBatchProps = {
  onSubmit: () => void
}

const ConfirmBatch = (props: ReviewTransactionProps) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const batchTxs = useDraftBatch()

  useEffect(() => {
    const calls = batchTxs.map((tx) => tx.txData)
    createMultiSendCallOnlyTx(calls).then(setSafeTx).catch(setSafeTxError)
  }, [batchTxs, setSafeTx, setSafeTxError])

  return <ReviewTransaction {...props} title={COPY.reviewTitle} />
}

const ConfirmBatchFlow = ({ onSubmit }: ConfirmBatchProps) => {
  const { length } = useDraftBatch()

  return (
    <TxFlow
      icon={BatchIcon}
      subtitle={COPY.subtitle(length)}
      eventCategory={TxFlowType.CONFIRM_BATCH}
      ReviewTransactionComponent={ConfirmBatch}
      onSubmit={onSubmit}
      isBatch
    />
  )
}

export default ConfirmBatchFlow
