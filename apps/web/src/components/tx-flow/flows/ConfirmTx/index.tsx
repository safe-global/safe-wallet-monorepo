import { isSwapOrderTxInfo } from '@/utils/transaction-guards'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import ConfirmProposedTx from './ConfirmProposedTx'
import { useTransactionType } from '@/hooks/useTransactionType'
import SwapIcon from '@/public/images/common/swap.svg'
import { useMemo } from 'react'
import useTxStepper from '../../useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

const ConfirmTxFlow = ({ txSummary }: { txSummary: TransactionSummary }) => {
  const { text } = useTransactionType(txSummary)
  const isSwapOrder = isSwapOrderTxInfo(txSummary.txInfo)
  const { data, step, nextStep, prevStep } = useTxStepper({})

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ConfirmProposedTx key={0} txSummary={txSummary} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} txId={txSummary.id} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data, txSummary],
  )

  return (
    <TxLayout
      subtitle={<>{text}&nbsp;</>}
      icon={isSwapOrder && SwapIcon}
      step={step}
      onBack={prevStep}
      txSummary={txSummary}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default ConfirmTxFlow
