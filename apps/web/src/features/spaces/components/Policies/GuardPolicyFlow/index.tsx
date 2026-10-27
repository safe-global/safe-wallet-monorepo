import type { ComponentType, ReactElement, ReactNode } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import type ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import type { TxFlowType } from '@/services/analytics'
import { GUARD_POLICY_CREATE_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import type { GuardPolicyBaseFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import type { PolicySafe } from '@safe-global/views/features/spaces/components/Policies/types'

export type GuardPolicyFlowProps<T extends GuardPolicyBaseFormValues> = {
  icon: ComponentType
  title: string
  eventCategory: TxFlowType
  /** Opened for one Safe, e.g. from its row on the Policies page; the picker then starts on it. */
  safe?: PolicySafe
  initialData: T
  ReviewTransactionComponent: typeof ReviewTransaction
  /** Step 1: the policy's form. */
  children: ReactNode
  /** Defaults to the create title; the edit flow renames the step without forking the shell. */
  stepTitle?: string
}

/**
 * The shell every guard policy runs in, as `SpendingLimitFlow` is for a spending limit: a SafeScope above the
 * TxFlow so every tx-flow hook resolves the Safe step 1 picks, one form step, then the policy's review and the
 * shared Sign/Execute steps.
 */
const GuardPolicyFlow = <T extends GuardPolicyBaseFormValues>({
  icon,
  title,
  eventCategory,
  safe,
  initialData,
  ReviewTransactionComponent,
  children,
  stepTitle = GUARD_POLICY_CREATE_STEP_TITLE,
}: GuardPolicyFlowProps<T>): ReactElement => (
  <SafeScopeProvider initial={safe ? { chainId: safe.chainId, safeAddress: safe.address } : undefined}>
    <TxFlow
      icon={icon}
      subtitle={title}
      ReviewTransactionComponent={ReviewTransactionComponent}
      eventCategory={eventCategory}
      initialData={initialData}
    >
      <TxFlowStep title={stepTitle} hideNonce>
        {children}
      </TxFlowStep>
    </TxFlow>
  </SafeScopeProvider>
)

export default GuardPolicyFlow
