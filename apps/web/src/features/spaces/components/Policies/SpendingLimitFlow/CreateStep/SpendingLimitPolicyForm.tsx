import { useEffect, useRef, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Button } from '@/components/ui/button'
import type { SafeAccountEntry } from '../../SafeAccountSelector/types'
import SafeAccountField from './SafeAccountField'
import SpenderCallout from './SpenderCallout'
import SpenderCard from './SpenderCard'
import { createEmptyLimit, createEmptySpender, limitPath, type SpendingLimitPolicyFormValues } from '../types'
import { ADD_SPENDER_LABEL, NEXT_LABEL } from '../constants'

export type SpendingLimitPolicyFormProps = {
  defaultValues: SpendingLimitPolicyFormValues
  onSubmit: (values: SpendingLimitPolicyFormValues) => void
  accounts: SafeAccountEntry[]
  isAccountsLoading: boolean
  isAccountsError: boolean
  onRetryAccounts: () => void
  hasWallet: boolean
  onSafeChange: (chainId: string, address: string) => void
  /** `${chainId}:${address}` of the scoped Safe; a change after mount clears every token selection. */
  scopeKey?: string
  /** Every spender address currently typed, for the poisoning check the connected step runs. */
  onSpendersChange?: (addresses: string[]) => void
  isCalloutDismissed: boolean
  onDismissCallout: () => void
}

/**
 * Safe → spender cards → limit rows. It takes accounts and the scope key as props and hands values back
 * through callbacks, so it renders in Storybook and tests without `TxFlow`.
 */
const SpendingLimitPolicyForm = ({
  defaultValues,
  onSubmit,
  accounts,
  isAccountsLoading,
  isAccountsError,
  onRetryAccounts,
  hasWallet,
  onSafeChange,
  scopeKey,
  onSpendersChange,
  isCalloutDismissed,
  onDismissCallout,
}: SpendingLimitPolicyFormProps): ReactElement => {
  const formMethods = useForm<SpendingLimitPolicyFormValues>({ defaultValues, mode: 'onChange' })
  const { control, handleSubmit, formState, watch, getValues, setValue } = formMethods
  const { fields, append, remove } = useFieldArray({ control, name: 'spenders' })

  // Every field of a limit is tied to the Safe it was entered for: its token exists on that chain, and only a test
  // chain offers the short reset periods. Switching Safe therefore empties the rows rather than leaving an amount
  // with no token. Spenders are addresses, so they stay. The first selection is not a switch.
  const previousScopeKey = useRef(scopeKey)
  useEffect(() => {
    const previous = previousScopeKey.current
    previousScopeKey.current = scopeKey
    if (previous === undefined || previous === scopeKey) return

    const empty = createEmptyLimit()
    getValues('spenders').forEach((spender, spenderIndex) =>
      spender.limits.forEach((_, limitIndex) => {
        // Validated, so the emptied rows disable Next until they are filled in for the new Safe.
        const options = { shouldValidate: true, shouldDirty: true }
        setValue(limitPath(spenderIndex, limitIndex, 'tokenAddress'), empty.tokenAddress, options)
        setValue(limitPath(spenderIndex, limitIndex, 'amount'), empty.amount, options)
        setValue(limitPath(spenderIndex, limitIndex, 'resetTime'), empty.resetTime, options)
      }),
    )
  }, [scopeKey, getValues, setValue])

  // RHF hands back the same mutated array every render, so key on the joined values, not the reference.
  const spenderAddressesKey = (watch('spenders') ?? []).map((spender) => spender?.address ?? '').join(',')
  useEffect(() => {
    onSpendersChange?.(spenderAddressesKey.split(',').filter(Boolean))
  }, [spenderAddressesKey, onSpendersChange])

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          data-testid="spending-limit-policy-form"
        >
          <SpenderCallout dismissed={isCalloutDismissed} onDismiss={onDismissCallout} />

          <SafeAccountField
            accounts={accounts}
            isLoading={isAccountsLoading}
            isError={isAccountsError}
            onRetry={onRetryAccounts}
            hasWallet={hasWallet}
            onSafeChange={onSafeChange}
          />

          {fields.map((field, index) => (
            <SpenderCard
              key={field.id}
              spenderIndex={index}
              spenderCount={fields.length}
              removable={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}

          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => append(createEmptySpender())}
              data-testid="add-spender-btn"
            >
              <Plus />
              {ADD_SPENDER_LABEL}
            </Button>
          </div>

          <TxCardActions>
            <Button type="submit" size="submit" disabled={!formState.isValid} data-testid="next-btn">
              {NEXT_LABEL}
            </Button>
          </TxCardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default SpendingLimitPolicyForm
