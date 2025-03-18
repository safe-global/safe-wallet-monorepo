import { type ReactElement, useContext, useEffect, useMemo } from 'react'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import TxLayout from '../../common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import BatchIcon from '@/public/images/common/batch.svg'
import { useDraftBatch } from '@/hooks/useDraftBatch'
import { maybePlural } from '@/utils/formatters'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import useTxStepper from '../../useTxStepper'
import ReviewTransaction from '@/components/tx/ReviewTransaction'
import { TxFlowType } from '@/services/analytics'

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

const ConfirmBatch = ({ onSubmit }: ConfirmBatchProps): ReactElement => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const batchTxs = useDraftBatch()

  useEffect(() => {
    const calls = batchTxs.map((tx) => getData(tx.txDetails))
    createMultiSendCallOnlyTx(calls).then(setSafeTx).catch(setSafeTxError)
  }, [batchTxs, setSafeTx, setSafeTxError])

  return <ReviewTransaction onSubmit={onSubmit} isBatch />
}

const ConfirmBatchFlow = (props: ConfirmBatchProps) => {
  const { length } = useDraftBatch()
  const { step, nextStep, prevStep } = useTxStepper(undefined, TxFlowType.CONFIRM_BATCH)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm batch' },
        content: <ConfirmBatch key={0} onSubmit={() => nextStep(undefined)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} {...props} />,
      },
    ],
    [nextStep, props],
  )

  return (
    <TxLayout
      subtitle={`This batch contains ${length} transaction${maybePlural(length)}`}
      icon={BatchIcon}
      step={step}
      onBack={prevStep}
      isBatch
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default ConfirmBatchFlow
