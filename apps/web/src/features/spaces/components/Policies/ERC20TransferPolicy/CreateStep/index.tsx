import { useForm } from 'react-hook-form'
import type { ReactElement } from 'react'
import { isAddress } from 'ethers'
import {
  createTokenAllowlistFormValues,
  type TokenAllowlistFormValues,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import GuardPolicyForm from '../../GuardPolicyFlow/GuardPolicyForm'
import { useGuardPolicyStep } from '../../GuardPolicyFlow/hooks/useGuardPolicyStep'
import TokenAllowlistForm from './TokenAllowlistForm'

const hasEntries = (rows: Array<{ address: string }>) => rows.some((row) => isAddress(row.address))

/** Step 1: at least one token and one recipient, on top of the shared Safe picker. */
const CreateTokenAllowlistPolicy = (): ReactElement => {
  const { data, onNext, accountProps } = useGuardPolicyStep<TokenAllowlistFormValues>()
  const formMethods = useForm<TokenAllowlistFormValues>({
    defaultValues: data ?? createTokenAllowlistFormValues(),
    mode: 'onChange',
  })

  const values = formMethods.watch()
  const isIncomplete = !hasEntries(values.tokens ?? []) || !hasEntries(values.recipients ?? [])

  return (
    <GuardPolicyForm
      formMethods={formMethods}
      safeId={values.safe}
      onSubmit={onNext}
      submitDisabled={isIncomplete}
      data-testid="token-allowlist-form"
      {...accountProps}
    >
      <TokenAllowlistForm />
    </GuardPolicyForm>
  )
}

export default CreateTokenAllowlistPolicy
