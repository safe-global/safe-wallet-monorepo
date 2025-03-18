import { useMemo, type ReactElement } from 'react'
import TxLayout from '../../common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import RejectTx from './RejectTx'
import useTxStepper from '../../useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

type RejectTxProps = {
  txNonce: number
}

const RejectTxFlow = ({ txNonce }: RejectTxProps): ReactElement => {
  const { data, step, nextStep, prevStep } = useTxStepper(null)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <RejectTx key={0} txNonce={txNonce} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} isRejection />,
      },
    ],
    [nextStep, data, txNonce],
  )

  return (
    <TxLayout subtitle="Reject" step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default RejectTxFlow
