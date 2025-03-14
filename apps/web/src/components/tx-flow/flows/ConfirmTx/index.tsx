import { isSwapOrderTxInfo } from '@/utils/transaction-guards'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import ConfirmProposedTx from './ConfirmProposedTx'
import { useTransactionType } from '@/hooks/useTransactionType'
import SwapIcon from '@/public/images/common/swap.svg'
import { use, useMemo } from 'react'
import useTxStepper from '../../useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { isExecutable, isMultisigExecutionInfo, isSignableBy } from '@/utils/transaction-guards'
import { useSigner } from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'

const ConfirmTxFlow = ({ txSummary }: { txSummary: TransactionSummary }) => {
  const { text } = useTransactionType(txSummary)
  const isSwapOrder = isSwapOrderTxInfo(txSummary.txInfo)
  const { data, step, nextStep, prevStep } = useTxStepper({})
  const signer = useSigner()
  const { safe } = useSafeInfo()

  const txId = txSummary.id
  const txNonce = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo.nonce : undefined
  const canExecute = isExecutable(txSummary, signer?.address || '', safe)
  const canSign = isSignableBy(txSummary, signer?.address || '')

  const commonProps = useMemo(
    () => ({ txId, isExecutable: canExecute, onlyExecute: !canSign, showMethodCall: true }),
    [txId, canExecute, canSign],
  )

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ConfirmProposedTx key={0} txNonce={txNonce} onSubmit={() => nextStep(data)} {...commonProps} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} {...commonProps} />,
      },
    ],
    [nextStep, data, commonProps, txNonce],
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
