import { useContext, useEffect } from 'react'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { OperationType } from '@safe-global/types-kit'
import BatchIcon from '@/public/images/common/batch.svg'
import { useDraftBatch } from '@/hooks/useDraftBatch'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'

type ConfirmBatchProps = {
  onSubmit: () => void
}

const getData = (txDetails: TransactionDetails): MetaTransactionData => {
  return {
    to: txDetails.txData?.to.value ?? '',
    value: txDetails.txData?.value ?? '0',
    data: txDetails.txData?.hexData ?? '0x',
    operation: OperationType.Call, // only calls can be batched
  }
}

const ConfirmBatch = (props: ReviewTransactionProps) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const batchTxs = useDraftBatch()

  useEffect(() => {
    const calls = batchTxs.map((tx) => getData(tx.txDetails))
    createMultiSendCallOnlyTx(calls).then(setSafeTx).catch(setSafeTxError)
  }, [batchTxs, setSafeTx, setSafeTxError])

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
