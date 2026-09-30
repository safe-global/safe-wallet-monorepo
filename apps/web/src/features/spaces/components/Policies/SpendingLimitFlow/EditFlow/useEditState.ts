import { useCallback, useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'
import { describeRemovals, findPendingRemovals, type RemovalCopy } from '../utils/removals'
import { hasEditChanges } from '../utils/hasEditChanges'
import { toSpendingLimitFormValues } from '../utils/prefill'
import type { SpendingLimitPolicyFormValues } from '../types'
import { useIsEditMode } from './EditModeContext'

export type EditState = {
  /** The notice that stands in for the rows an edit would remove; absent while nothing would go. */
  removalCopy?: RemovalCopy
  /** Puts the form back to the policy the chain holds. */
  discardChanges: () => void
  /** The edit changes nothing, so there would be nothing to sign. */
  isUnchangedEdit: boolean
}

/**
 * Everything the form only knows in edit mode, judged against the limits the Safe holds.
 *
 * @param form - The form's own methods; the provider is mounted below the caller, so this cannot
 *   come from `useFormContext`.
 * @returns All-quiet defaults in the create flow, where there is no baseline to differ from.
 *
 * @remarks
 * Both memos key on `policyKey` rather than on the values themselves: `watch` hands back the same
 * array mutated in place every render, so a reference dependency would never fire. That is what the
 * `exhaustive-deps` disables below stand for, and the reason they live here rather than in the form.
 */
export const useEditState = (form: UseFormReturn<SpendingLimitPolicyFormValues>): EditState => {
  const { watch, getValues, reset } = form
  const isEditMode = useIsEditMode()
  const { limits: baseline } = useExistingSpendingLimits()

  const spenders = watch('spenders') ?? []
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

  const isUnchangedEdit = useMemo(
    () => isEditMode && baseline !== undefined && !hasEditChanges(baseline, getValues()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEditMode, baseline, policyKey],
  )

  // Back from the review step remounts the form with what was submitted, so `defaultValues` is no
  // longer the policy as the chain holds it — the only stable thing to restore is the chain itself.
  const discardChanges = useCallback(
    () => reset(toSpendingLimitFormValues(getValues('safe'), baseline ?? [])),
    [reset, getValues, baseline],
  )

  const isEmptyPolicy = spenders.every((spender) => !spender?.address)
  const removalCopy = removals && removals.limits > 0 ? describeRemovals(removals, isEmptyPolicy) : undefined

  return { removalCopy, discardChanges, isUnchangedEdit }
}
