import { useMemo } from 'react'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '@/components/tx-flow/common/TxLayout'
import { UpdateSafeReview } from './UpdateSafeReview'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import useTxStepper from '../../useTxStepper'
import { TxFlowType } from '@/services/analytics'

const UpdateSafeFlow = () => {
  const { step, nextStep, prevStep } = useTxStepper(undefined, TxFlowType.UPDATE_SAFE)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Review transaction' },
        content: <UpdateSafeReview key={0} onSubmit={() => nextStep(undefined)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} />,
      },
    ],
    [nextStep],
  )

  return (
    <TxLayout
      subtitle="Update Safe Account version"
      icon={SettingsIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default UpdateSafeFlow
