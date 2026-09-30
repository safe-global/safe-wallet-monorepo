import { useCallback, useEffect, useMemo, useRef, type ReactElement } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import type { SafeAccountEntry } from '../../SafeAccountSelector/types'
import { findSafeAccount } from '../../SafeAccountSelector/utils'
import { useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'
import { useIsEditMode } from '../EditFlow/EditModeContext'
import { describeRemovals, findPendingRemovals } from '../utils/removals'
import { hasEditChanges } from '../utils/hasEditChanges'
import { toSpendingLimitFormValues } from '../utils/prefill'
import SafeAccountField from './SafeAccountField'
import SpenderCallout from './SpenderCallout'
import SpenderCard from './SpenderCard'
import { createDefaultFormValues, createEmptySpender, type SpendingLimitPolicyFormValues } from '../types'
import { ADD_SPENDER_LABEL, DISCARD_CHANGES_LABEL, NEXT_LABEL } from '../constants'

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
  const { control, handleSubmit, formState, watch, getValues, reset } = formMethods
  const { fields, append, remove } = useFieldArray({ control, name: 'spenders' })
  const isEditMode = useIsEditMode()
  const { limits: baseline } = useExistingSpendingLimits()

  // A limit is entered for one Safe: its token exists on that Safe's chain, and only a test chain offers the short
  // reset periods. Switching Safe therefore starts the policy over rather than leaving fields that describe the
  // previous one. The first selection is not a switch, and an edit cannot switch Safe at all.
  const previousScopeKey = useRef(scopeKey)
  useEffect(() => {
    const previous = previousScopeKey.current
    previousScopeKey.current = scopeKey
    if (isEditMode || previous === undefined || previous === scopeKey) return

    reset({ ...createDefaultFormValues(), safe: getValues('safe') })
  }, [isEditMode, scopeKey, getValues, reset])

  // RHF hands back the same mutated array every render, so key on the joined values, not the reference.
  const spenders = watch('spenders') ?? []
  const spenderAddressesKey = spenders.map((spender) => spender?.address ?? '').join(',')
  useEffect(() => {
    onSpendersChange?.(spenderAddressesKey.split(',').filter(Boolean))
  }, [spenderAddressesKey, onSpendersChange])

  const policyKey = spenders
    .map(
      (spender) =>
        `${spender?.address ?? ''}>${(spender?.limits ?? [])
          .map((limit) => `${limit?.tokenAddress ?? ''}:${limit?.amount ?? ''}:${limit?.resetTime ?? ''}`)
          .join('|')}`,
    )
    .join(',')
  const removals = useMemo(
    () => (isEditMode && baseline ? findPendingRemovals(baseline, getValues()) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEditMode, baseline, policyKey],
  )
  // Back from the review step remounts the form with what was submitted, so `defaultValues` is no longer
  // the policy as the chain holds it — the only stable thing to restore is the chain itself.
  const discardChanges = useCallback(
    () => reset(toSpendingLimitFormValues(getValues('safe'), baseline ?? [])),
    [reset, getValues, baseline],
  )

  // Nothing to sign for an edit that changes nothing, so the step does not offer to move on.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isUnchangedEdit = useMemo(
    () => isEditMode && baseline !== undefined && !hasEditChanges(baseline, getValues()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEditMode, baseline, policyKey],
  )

  const isEmptyPolicy = spenders.every((spender) => !spender?.address)
  const removalCopy = removals && removals.limits > 0 ? describeRemovals(removals, isEmptyPolicy) : undefined

  // The selector shows a placeholder for a Safe the resolved list lacks (prefilled, or a wallet switch after picking).
  const selectedSafe = findSafeAccount(accounts, watch('safe'))
  const isSafeBlocked = !isEditMode && (!selectedSafe || Boolean(selectedSafe.ineligibleReason))

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          data-testid="spending-limit-policy-form"
        >
          {!isEditMode && <SpenderCallout dismissed={isCalloutDismissed} onDismiss={onDismissCallout} />}

          <SafeAccountField
            accounts={accounts}
            isLoading={isAccountsLoading}
            isError={isAccountsError}
            onRetry={onRetryAccounts}
            hasWallet={hasWallet}
            onSafeChange={onSafeChange}
            readOnly={isEditMode}
          />

          {removalCopy && (
            <Card variant="muted" size="none" radius="xl" data-testid="pending-removals">
              {/* `Card` takes spacing only through `size`/`radius`, so the padding lives on this div. */}
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <span className="flex size-9 items-center justify-center rounded-full bg-border">
                  <Trash2 className="size-[18px] text-muted-foreground" aria-hidden />
                </span>

                <div className="flex max-w-[26rem] flex-col gap-1">
                  <Typography variant="paragraph-bold">{removalCopy.title}</Typography>
                  <Typography variant="paragraph-small" className="text-muted-foreground">
                    {removalCopy.description}
                  </Typography>
                </div>

                <Button type="button" variant="outline" onClick={discardChanges}>
                  <RotateCcw />
                  {DISCARD_CHANGES_LABEL}
                </Button>
              </div>
            </Card>
          )}

          {fields.map((field, index) => (
            <SpenderCard
              key={field.id}
              spenderIndex={index}
              spenderCount={fields.length}
              removable={isEditMode || fields.length > 1}
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
            <Button
              type="submit"
              size="submit"
              disabled={!formState.isValid || isSafeBlocked || isUnchangedEdit}
              data-testid="next-btn"
            >
              {NEXT_LABEL}
            </Button>
          </TxCardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default SpendingLimitPolicyForm
