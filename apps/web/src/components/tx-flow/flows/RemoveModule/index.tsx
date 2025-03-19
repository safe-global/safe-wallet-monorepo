import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import { ReviewRemoveModule } from './ReviewRemoveModule'
import { useMemo } from 'react'
import useTxStepper from '../../useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

export type RemoveModuleFlowProps = {
  address: string
}

const RemoveModuleFlow = ({ address }: RemoveModuleFlowProps) => {
  const { step, nextStep, prevStep } = useTxStepper(undefined, TxFlowType.REMOVE_MODULE)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewRemoveModule key={0} params={{ address }} onSubmit={() => nextStep(undefined)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} />,
      },
    ],
    [nextStep, address],
  )

  return (
    <TxLayout subtitle="Remove module" step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default RemoveModuleFlow
