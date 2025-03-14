import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import { ReviewRemoveModule } from './ReviewRemoveModule'
import { useMemo } from 'react'
import useTxStepper from '../../useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

export type RemoveModuleFlowProps = {
  address: string
}

const RemoveModuleFlow = ({ address }: RemoveModuleFlowProps) => {
  const { data, step, nextStep, prevStep } = useTxStepper(null)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewRemoveModule key={0} params={{ address }} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data, address],
  )

  return (
    <TxLayout subtitle="Remove module" step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default RemoveModuleFlow
