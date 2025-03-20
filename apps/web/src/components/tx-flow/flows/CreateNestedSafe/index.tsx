import type { ReactElement } from 'react'

import NestedSafeIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import { ReviewNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe/ReviewNestedSafe'
import { SetUpNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'
import type { SetupNestedSafeForm } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'

export function CreateNestedSafe(): ReactElement {
  const { data, step, nextStep, prevStep } = useTxStepper<SetupNestedSafeForm>({
    name: '',
    assets: [],
  })

  const steps = [
    <SetUpNestedSafe key={0} params={data} onSubmit={(formData) => nextStep({ ...data, ...formData })} />,
    <ReviewNestedSafe key={1} params={data} />,
  ]

  return (
    <TxLayout
      title={step === 0 ? 'Set up Nested Safe' : 'Confirm Nested Safe'}
      subtitle="Create a Nested Safe"
      icon={NestedSafeIcon}
      step={step}
      onBack={prevStep}
    >
      {steps}
    </TxLayout>
  )
}
