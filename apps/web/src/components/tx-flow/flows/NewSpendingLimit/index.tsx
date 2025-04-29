import TxLayout from '../../common/TxLayout'
import type { TxStep } from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '../../useTxStepper'
import { CreateSpendingLimit } from './CreateSpendingLimit'
import { ReviewSpendingLimit } from './ReviewSpendingLimit'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TokenAmountFields } from '@/components/common/TokenAmountInput'
import { useMemo } from 'react'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

enum Fields {
  beneficiary = 'beneficiary',
  resetTime = 'resetTime',
}

export const SpendingLimitFields = { ...Fields, ...TokenAmountFields }

export type NewSpendingLimitFlowProps = {
  [SpendingLimitFields.beneficiary]: string
  [SpendingLimitFields.tokenAddress]: string
  [SpendingLimitFields.amount]: string
  [SpendingLimitFields.resetTime]: string
}

const defaultValues: NewSpendingLimitFlowProps = {
  beneficiary: '',
  tokenAddress: ZERO_ADDRESS,
  amount: '',
  resetTime: '0',
}

const NewSpendingLimitFlow = () => {
  const { data, step, nextStep, prevStep } = useTxStepper<NewSpendingLimitFlowProps>(
    defaultValues,
    TxFlowType.SETUP_SPENDING_LIMIT,
  )

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'New transaction' },
        content: (
          <CreateSpendingLimit key={0} params={data} onSubmit={(formData) => nextStep({ ...data, ...formData })} />
        ),
      },
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewSpendingLimit key={1} params={data} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data],
  )

  return (
    <TxLayout
      subtitle="Spending limit"
      icon={SaveAddressIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default NewSpendingLimitFlow
