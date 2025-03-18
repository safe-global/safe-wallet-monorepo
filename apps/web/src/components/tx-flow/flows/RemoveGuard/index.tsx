import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import { ReviewRemoveGuard } from '@/components/tx-flow/flows/RemoveGuard/ReviewRemoveGuard'
import useTxStepper from '../../useTxStepper'
import { useMemo } from 'react'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

// TODO: This can possibly be combined with the remove module type
export type RemoveGuardFlowProps = {
  address: string
}

const RemoveGuardFlow = ({ address }: RemoveGuardFlowProps) => {
  const { data, step, nextStep, prevStep } = useTxStepper(null)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewRemoveGuard key={0} params={{ address }} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data, address],
  )

  return (
    <TxLayout subtitle="Remove guard" step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default RemoveGuardFlow
