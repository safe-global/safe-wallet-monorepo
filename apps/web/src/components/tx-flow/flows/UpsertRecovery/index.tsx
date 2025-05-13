import type { ReactElement } from 'react'
import RecoveryPlus from '@/public/images/common/recovery-plus.svg'
import { UpsertRecoveryFlowReview as UpsertRecoveryFlowReview } from './UpsertRecoveryFlowReview'
import { UpsertRecoveryFlowSettings as UpsertRecoveryFlowSettings } from './UpsertRecoveryFlowSettings'
import { UpsertRecoveryFlowIntro as UpsertRecoveryFlowIntro } from './UpsertRecoveryFlowIntro'
import { DAY_IN_SECONDS } from './useRecoveryPeriods'
import type { RecoveryState } from '@/features/recovery/services/recovery-state'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'

export enum UpsertRecoveryFlowFields {
  recoverer = 'recoverer',
  delay = 'delay',
  customDelay = 'customDelay',
  selectedDelay = 'selectedDelay',
  expiry = 'expiry',
  moduleAddress = 'moduleAddress',
}

export type UpsertRecoveryFlowProps = {
  [UpsertRecoveryFlowFields.recoverer]: string
  [UpsertRecoveryFlowFields.delay]: string
  [UpsertRecoveryFlowFields.customDelay]: string
  [UpsertRecoveryFlowFields.selectedDelay]: string
  [UpsertRecoveryFlowFields.expiry]: string
  [UpsertRecoveryFlowFields.moduleAddress]?: string
}

function UpsertRecoveryFlow({ delayModifier }: { delayModifier?: RecoveryState[number] }): ReactElement {
  const initialData = {
    [UpsertRecoveryFlowFields.recoverer]: delayModifier?.recoverers?.[0] ?? '',
    [UpsertRecoveryFlowFields.delay]: '',
    [UpsertRecoveryFlowFields.selectedDelay]: delayModifier?.delay?.toString() ?? `${DAY_IN_SECONDS * 28}`, // 28 days in seconds
    [UpsertRecoveryFlowFields.customDelay]: '',
    [UpsertRecoveryFlowFields.expiry]: delayModifier?.expiry?.toString() ?? '0',
    [UpsertRecoveryFlowFields.moduleAddress]: delayModifier?.address,
  }

  return (
    <TxFlow
      initialData={initialData}
      eventCategory={TxFlowType.SETUP_RECOVERY}
      ReviewTransactionComponent={UpsertRecoveryFlowReview}
      icon={RecoveryPlus}
      title="Account recovery"
      subtitle="Set up account recovery"
    >
      <TxFlowStep title="Account recovery" subtitle="How does recovery work" hideNonce hideProgress>
        <UpsertRecoveryFlowIntro />
      </TxFlowStep>
      <TxFlowStep title="Account recovery" subtitle="Set up recovery settings" icon={RecoveryPlus}>
        <UpsertRecoveryFlowSettings />
      </TxFlowStep>
    </TxFlow>
  )
}

export default UpsertRecoveryFlow
