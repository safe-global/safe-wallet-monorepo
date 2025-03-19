import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import { ReviewRemoveGuard } from '@/components/tx-flow/flows/RemoveGuard/ReviewRemoveGuard'
import useTxStepper from '../../useTxStepper'
import { useMemo } from 'react'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

// TODO: This can possibly be combined with the remove module type
export type RemoveGuardFlowProps = {
  address: string
}

const RemoveGuardFlow = ({ address }: RemoveGuardFlowProps) => {
  const { step, nextStep, prevStep } = useTxStepper(undefined, TxFlowType.REMOVE_GUARD)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewRemoveGuard key={0} params={{ address }} onSubmit={() => nextStep(undefined)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
      },
    ],
    [nextStep, address],
  )

  return (
    <TxLayout subtitle="Remove guard" step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default RemoveGuardFlow
