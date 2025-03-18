import { useMemo, type ReactElement } from 'react'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import RecoveryPlus from '@/public/images/common/recovery-plus.svg'
import useTxStepper from '../../useTxStepper'
import { UpsertRecoveryFlowReview as UpsertRecoveryFlowReview } from './UpsertRecoveryFlowReview'
import { UpsertRecoveryFlowSettings as UpsertRecoveryFlowSettings } from './UpsertRecoveryFlowSettings'
import { UpsertRecoveryFlowIntro as UpsertRecoveryFlowIntro } from './UpsertRecoveryFlowIntro'
import { DAY_IN_SECONDS } from './useRecoveryPeriods'
import type { RecoveryState } from '@/features/recovery/services/recovery-state'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

export enum UpsertRecoveryFlowFields {
  recoverer = 'recoverer',
  delay = 'delay',
  customDelay = 'customDelay',
  selectedDelay = 'selectedDelay',
  expiry = 'expiry',
}

export type UpsertRecoveryFlowProps = {
  [UpsertRecoveryFlowFields.recoverer]: string
  [UpsertRecoveryFlowFields.delay]: string
  [UpsertRecoveryFlowFields.customDelay]: string
  [UpsertRecoveryFlowFields.selectedDelay]: string
  [UpsertRecoveryFlowFields.expiry]: string
}

function UpsertRecoveryFlow({ delayModifier }: { delayModifier?: RecoveryState[number] }): ReactElement {
  const { data, step, nextStep, prevStep } = useTxStepper<UpsertRecoveryFlowProps>(
    {
      [UpsertRecoveryFlowFields.recoverer]: delayModifier?.recoverers?.[0] ?? '',
      [UpsertRecoveryFlowFields.delay]: '',
      [UpsertRecoveryFlowFields.selectedDelay]: delayModifier?.delay?.toString() ?? `${DAY_IN_SECONDS * 28}`, // 28 days in seconds
      [UpsertRecoveryFlowFields.customDelay]: '',
      [UpsertRecoveryFlowFields.expiry]: delayModifier?.expiry?.toString() ?? '0',
    },
    TxFlowType.SETUP_RECOVERY,
  )

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: {
          title: 'Account recovery',
          subtitle: 'How does recovery work?',
          hideNonce: true,
          hideProgress: true,
        },
        content: <UpsertRecoveryFlowIntro key={0} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Account recovery', subtitle: 'Set up recovery settings', icon: RecoveryPlus },
        content: (
          <UpsertRecoveryFlowSettings
            key={1}
            params={data}
            delayModifier={delayModifier}
            onSubmit={(formData) => nextStep({ ...data, ...formData })}
          />
        ),
      },
      {
        txLayoutProps: { title: 'Confirm transaction', subtitle: 'Set up account recovery', icon: RecoveryPlus },
        content: (
          <UpsertRecoveryFlowReview
            key={2}
            params={data}
            moduleAddress={delayModifier?.address}
            onSubmit={() => nextStep(data)}
          />
        ),
      },
      {
        txLayoutProps: {
          title: 'Confirm transaction details',
          subtitle: 'Set up account recovery',
          icon: RecoveryPlus,
          fixedNonce: true,
        },
        content: <ConfirmTxDetails key={3} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data, delayModifier],
  )

  return (
    <TxLayout step={step} onBack={prevStep} {...(steps?.[step]?.txLayoutProps || {})}>
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default UpsertRecoveryFlow
