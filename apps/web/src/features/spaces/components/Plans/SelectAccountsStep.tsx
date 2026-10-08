import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { SafeAccountsTable, type SafeAccountColumnId } from '@/features/myAccounts'
import { isMultiChainSafeItem, useSafesSearch, type AllSafeItems, type SafeItem } from '@/hooks/safes'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { SafeRef } from '@views/features/spaces/components/Plans/types'
import { summarizeRemovedSafes } from '@views/features/spaces/components/Plans/removedSafes'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import { useSpaceSafes } from '../../hooks/useSpaceSafes'
import useOnboardingSelection from '../SelectSafesOnboarding/hooks/useOnboardingSelection'
import { getMultiChainSafeId, getSafeId } from '@views/features/spaces/components/SelectSafesOnboarding/utils/safeIds'
import { SelectAccountsStepView } from '@views/features/spaces/components/Plans/SelectAccountsStepView'

export { seatsTooltip } from '@views/features/spaces/components/Plans/SelectAccountsStepView'

const COLUMNS: SafeAccountColumnId[] = ['name', 'networks', 'balance']
const NO_FLAGGED = new Set<string>()

const leavesOf = (items: AllSafeItems): SafeItem[] =>
  items.flatMap((item) => (isMultiChainSafeItem(item) ? item.safes : [item]))

/** Every Safe starts selected (multi-chain parents included); the user deselects down to the plan's seats. */
export const _initialSelection = (items: AllSafeItems): Record<string, boolean> => {
  const selected: Record<string, boolean> = {}
  for (const item of items) {
    if (isMultiChainSafeItem(item)) {
      selected[getMultiChainSafeId(item)] = true
      for (const safe of item.safes) selected[getSafeId(safe)] = true
    } else {
      selected[getSafeId(item)] = true
    }
  }
  return selected
}

/** Trims the Workspace to the plan's seats before the plan is taken; the Safes deselected are removed from it. */
export default function SelectAccountsStep({
  limit,
  planName,
  continueLabel,
  onBack,
  onContinue,
  isSubmitting,
  error,
}: {
  limit: number
  planName: string
  /** Names where the step leads: Stripe for a new plan, the change summary for a live one. */
  continueLabel?: string
  onBack: () => void
  onContinue: (removed: SafeRef[]) => void
  isSubmitting?: boolean
  error?: string
}) {
  const { allSafes, isLoading } = useSpaceSafes()
  const [query, setQuery] = useState('')
  const filtered = useSafesSearch(allSafes, query.trim())
  const items = query.trim() ? filtered : allSafes
  const { control, setValue } = useForm<AddAccountsFormValues>({
    defaultValues: { selectedSafes: _initialSelection(allSafes) },
  })
  const { selectedKeys, seatCount, isAtLimit, isOverLimit, handleToggle } = useOnboardingSelection({
    items: allSafes,
    control,
    setValue,
    flaggedAddresses: NO_FLAGGED,
    limit,
  })
  const leaves = useMemo(() => leavesOf(allSafes), [allSafes])
  const removed = useMemo(() => leaves.filter((safe) => !selectedKeys.has(getSafeId(safe))), [leaves, selectedKeys])
  const removedSummary = summarizeRemovedSafes(leaves, removed)
  useTrackOnce(
    SAFE_PRO_EVENTS.SAFE_ACCOUNT_SELECTION_VIEWED,
    { [MixpanelEventParams.ACCOUNTS_AVAILABLE]: seatCount, [MixpanelEventParams.PLAN_LIMIT]: limit },
    !isLoading,
  )

  return (
    <SelectAccountsStepView
      limit={limit}
      planName={planName}
      continueLabel={continueLabel}
      onBack={onBack}
      onContinue={() => onContinue(removed.map(({ chainId, address }) => ({ chainId, address })))}
      isSubmitting={isSubmitting}
      error={error}
      query={query}
      onQueryChange={setQuery}
      isEmpty={!isLoading && items.length === 0}
      table={
        <SafeAccountsTable
          items={items}
          columns={COLUMNS}
          embedded
          selection={{ selectedKeys, onToggle: handleToggle, isAtLimit }}
          data-testid="plan-safes-table"
        />
      }
      seatCount={seatCount}
      selectedCount={selectedKeys.size}
      submitTrackingParams={{
        [MixpanelEventParams.SELECTED_COUNT]: seatCount,
        [MixpanelEventParams.DESELECTED_COUNT]: removed.length,
        [MixpanelEventParams.PLAN_LIMIT]: limit,
      }}
      isOverLimit={isOverLimit}
      removedSummary={removedSummary}
    />
  )
}
