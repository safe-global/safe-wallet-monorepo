import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import { RemoveSpendingLimit } from './RemoveSpendingLimit'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { useMemo } from 'react'
import useTxStepper from '../../useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

const RemoveSpendingLimitFlow = ({ spendingLimit }: { spendingLimit: SpendingLimitState }) => {
  const { step, nextStep, prevStep } = useTxStepper(undefined, TxFlowType.REMOVE_SPENDING_LIMIT)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <RemoveSpendingLimit params={spendingLimit} key={0} onSubmit={() => nextStep(undefined)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={1} onSubmit={() => {}} />,
      },
    ],
    [nextStep, spendingLimit],
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
