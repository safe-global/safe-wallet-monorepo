import { useMemo, type ReactElement } from 'react'
import TxLayout from '../../common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import { CancelRecoveryFlowReview } from './CancelRecoveryFlowReview'
import { CancelRecoveryOverview } from './CancelRecoveryOverview'
import useTxStepper from '../../useTxStepper'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

const TITLE = 'Cancel Account recovery'

function CancelRecoveryFlow({ recovery }: { recovery: RecoveryQueueItem }): ReactElement {
  const { step, nextStep, prevStep } = useTxStepper<undefined>(undefined, TxFlowType.CANCEL_RECOVERY)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: TITLE, hideNonce: true },
        content: <CancelRecoveryOverview key={0} onSubmit={() => nextStep(undefined)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction', subtitle: TITLE },
        content: <CancelRecoveryFlowReview key={1} recovery={recovery} onSubmit={() => nextStep(undefined)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', subtitle: TITLE, fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
      },
    ],
    [nextStep, recovery],
  )

  return (
    <TxLayout step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default CancelRecoveryFlow
