import TxLayout from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import { SelectNetworkStep } from './SelectNetworkStep'
import { type SafeSetup } from '../../utils/utils'
import { ReviewSynchronizeSignersStep } from './ReviewSynchronizeSignersStep'

export type SynchronizeSetupsData = {
  selectedChain: string | null
}

export const SynchronizeSetupsFlow = ({ deviatingSetups }: { deviatingSetups: SafeSetup[] }) => {
  const { data, step, nextStep, prevStep } = useTxStepper<SynchronizeSetupsData>({ selectedChain: null })

  const steps = [
    <SelectNetworkStep
      key={0}
      onSubmit={(formData) => nextStep({ ...data, ...formData })}
      data={data}
      deviatingSetups={deviatingSetups}
    />,
    <ReviewSynchronizeSignersStep key={1} data={data} setups={deviatingSetups} />,
  ]
  return (
    <TxLayout
      title="Synchronize setup"
      subtitle="Apply the Safe setup of another network"
      step={step}
      onBack={prevStep}
    >
      {steps}
    </TxLayout>
  )
}
