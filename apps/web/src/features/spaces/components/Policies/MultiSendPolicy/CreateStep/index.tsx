import { useForm } from 'react-hook-form'
import type { ReactElement } from 'react'
import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@safe-global/views/components/ui/alert'
import {
  createMultiSendFormValues,
  type MultiSendPolicyFormValues,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import {
  MULTISEND_EXPLAINER_TEXT,
  MULTISEND_EXPLAINER_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import GuardPolicyForm from '../../GuardPolicyFlow/GuardPolicyForm'
import { useGuardPolicyStep } from '../../GuardPolicyFlow/hooks/useGuardPolicyStep'

/** Step 1: the policy has nothing to configure beyond the Safe, so the card explains what it does. */
const CreateMultiSendPolicy = (): ReactElement => {
  const { data, onNext, accountProps } = useGuardPolicyStep<MultiSendPolicyFormValues>()
  const formMethods = useForm<MultiSendPolicyFormValues>({
    defaultValues: data ?? createMultiSendFormValues(),
    mode: 'onChange',
  })
  const safeId = formMethods.watch('safe')

  return (
    <GuardPolicyForm
      formMethods={formMethods}
      safeId={safeId}
      onSubmit={onNext}
      data-testid="multisend-policy-form"
      {...accountProps}
    >
      <Alert>
        <Info className="size-4" aria-hidden />
        <AlertTitle>{MULTISEND_EXPLAINER_TITLE}</AlertTitle>
        <AlertDescription>{MULTISEND_EXPLAINER_TEXT}</AlertDescription>
      </Alert>
    </GuardPolicyForm>
  )
}

export default CreateMultiSendPolicy
