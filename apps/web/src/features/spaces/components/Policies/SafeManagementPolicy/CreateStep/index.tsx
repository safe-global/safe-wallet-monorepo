import { useForm } from 'react-hook-form'
import type { ReactElement } from 'react'
import {
  createSafeManagementFormValues,
  type SafeManagementFormValues,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import GuardPolicyForm from '../../GuardPolicyFlow/GuardPolicyForm'
import { useGuardPolicyStep } from '../../GuardPolicyFlow/hooks/useGuardPolicyStep'
import { GUARD_CRITICAL_FUNCTION_IDS, SAFE_MANAGEMENT_FUNCTION_IDS } from '../contracts'
import SafeManagementFields from './SafeManagementFields'

/** Step 1: which management changes stay allowed. Everything starts selected, as today's Safe allows all. */
const CreateSafeManagementPolicy = (): ReactElement => {
  const { data, onNext, accountProps } = useGuardPolicyStep<SafeManagementFormValues>()
  const formMethods = useForm<SafeManagementFormValues>({
    defaultValues: data ?? createSafeManagementFormValues(SAFE_MANAGEMENT_FUNCTION_IDS),
    mode: 'onChange',
  })

  const values = formMethods.watch()
  const functionIds = values.functionIds ?? []
  const needsGuardConsent = !GUARD_CRITICAL_FUNCTION_IDS.every((id) => functionIds.includes(id))
  const isBlocked = functionIds.length === 0 || (needsGuardConsent && !values.guardLockConfirmed)

  return (
    <GuardPolicyForm
      formMethods={formMethods}
      safeId={values.safe}
      onSubmit={onNext}
      submitDisabled={isBlocked}
      data-testid="safe-management-form"
      {...accountProps}
    >
      <SafeManagementFields />
    </GuardPolicyForm>
  )
}

export default CreateSafeManagementPolicy
