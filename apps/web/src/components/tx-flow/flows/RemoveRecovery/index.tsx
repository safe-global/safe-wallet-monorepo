import { useMemo, type ReactElement } from 'react'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import RecoveryPlus from '@/public/images/common/recovery-plus.svg'
import useTxStepper from '../../useTxStepper'
import { RemoveRecoveryFlowOverview } from './RemoveRecoveryFlowOverview'
import { RemoveRecoveryFlowReview } from './RemoveRecoveryFlowReview'
import type { RecoveryStateItem } from '@/features/recovery/services/recovery-state'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

export type RecoveryFlowProps = {
  delayModifier: RecoveryStateItem
}

function RemoveRecoveryFlow({ delayModifier }: RecoveryFlowProps): ReactElement {
  const { step, nextStep, prevStep } = useTxStepper<undefined>(undefined, TxFlowType.REMOVE_RECOVERY)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Remove Account recovery' },
        content: (
          <RemoveRecoveryFlowOverview key={0} delayModifier={delayModifier} onSubmit={() => nextStep(undefined)} />
        ),
      },
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: (
          <RemoveRecoveryFlowReview key={1} delayModifier={delayModifier} onSubmit={() => nextStep(undefined)} />
        ),
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
      },
    ],
    [nextStep, delayModifier],
  )

  return (
    <TxLayout
      subtitle="Remove Recoverer"
      icon={RecoveryPlus}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default RemoveRecoveryFlow
