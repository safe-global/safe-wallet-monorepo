import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import { RemoveSpendingLimit } from './RemoveSpendingLimit'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { useMemo } from 'react'
import useTxStepper from '../../useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

const RemoveSpendingLimitFlow = ({ spendingLimit }: { spendingLimit: SpendingLimitState }) => {
  const { data, step, nextStep, prevStep } = useTxStepper(null)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <RemoveSpendingLimit params={spendingLimit} key={0} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data, spendingLimit],
  )

  return (
    <TxLayout
      subtitle="Remove spending limit"
      icon={SaveAddressIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default RemoveSpendingLimitFlow
