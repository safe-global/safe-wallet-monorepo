import { useMemo } from 'react'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '@/components/tx-flow/common/TxLayout'
import { UpdateSafeReview } from './UpdateSafeReview'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import useTxStepper from '../../useTxStepper'

const UpdateSafeFlow = () => {
  const { data, step, nextStep, prevStep } = useTxStepper({})

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Review transaction' },
        content: <UpdateSafeReview key={1} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data],
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
