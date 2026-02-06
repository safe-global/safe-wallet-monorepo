import { useContext, useEffect } from 'react'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import BatchIcon from '@/public/images/common/batch.svg'
import { useDraftBatch } from '@/hooks/useDraftBatch'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'

type ConfirmBatchProps = {
  onSubmit: () => void
}

const ConfirmBatch = (props: ReviewTransactionProps & { txNonce?: number }) => {
  const { setSafeTx, setSafeTxError, nonce } = useContext(SafeTxContext)

  const batchTxs = useDraftBatch()

  useEffect(() => {
    if (!nonce) return
    const calls = batchTxs.map((tx) => tx.txData)
    createMultiSendCallOnlyTx(calls, { nonce }).then(setSafeTx).catch(setSafeTxError)
  }, [batchTxs, setSafeTx, setSafeTxError, nonce])

  return <ReviewTransaction {...props} title="Confirm batch" />
}

const ConfirmBatchFlow = ({ onSubmit }: ConfirmBatchProps) => {
  const { length } = useDraftBatch()

  return (
    <TxFlow
      icon={BatchIcon}
      subtitle={`This batch contains ${length} transaction${maybePlural(length)}`}
      eventCategory={TxFlowType.CONFIRM_BATCH}
      ReviewTransactionComponent={ConfirmBatch}
      onSubmit={onSubmit}
      isBatch
    />
  )
}

export default ConfirmBatchFlow
