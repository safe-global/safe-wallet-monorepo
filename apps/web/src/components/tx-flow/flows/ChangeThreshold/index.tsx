import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '@/components/tx-flow/common/TxLayout'
import ReviewChangeThreshold from '@/components/tx-flow/flows/ChangeThreshold/ReviewChangeThreshold'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChooseThreshold } from '@/components/tx-flow/flows/ChangeThreshold/ChooseThreshold'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'

export enum ChangeThresholdFlowFieldNames {
  threshold = 'threshold',
}

export type ChangeThresholdFlowProps = {
  [ChangeThresholdFlowFieldNames.threshold]: number
}

const ChangeThresholdFlow = () => {
  const { safe } = useSafeInfo()

  const { data, step, nextStep, prevStep } = useTxStepper<ChangeThresholdFlowProps>(
    {
      [ChangeThresholdFlowFieldNames.threshold]: safe.threshold,
    },
    TxFlowType.CHANGE_THRESHOLD,
  )

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'New transaction' },
        content: <ChooseThreshold key={0} params={data} onSubmit={(formData) => nextStep(formData)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewChangeThreshold key={1} params={data} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} showMethodCall />,
      },
    ],
    [nextStep, data],
  )

  return (
    <TxLayout
      subtitle="Change threshold"
      icon={SaveAddressIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default ChangeThresholdFlow
