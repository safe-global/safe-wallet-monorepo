import TxLayout, { type TxStep } from '@/components/tx-flow/common/TxLayout'
import { MigrateSafeL2Review } from './MigrateSafeL2Review'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { useMemo } from 'react'
import useTxStepper from '../../useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

const MigrateSafeL2Flow = () => {
  const { data, step, nextStep, prevStep } = useTxStepper(undefined)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <MigrateSafeL2Review key={0} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data],
  )

  return (
    <TxLayout
      subtitle="Update Safe Account base contract"
      icon={SettingsIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default MigrateSafeL2Flow
