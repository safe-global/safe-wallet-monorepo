import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SearchInput } from '@/components/ui/search-input'
import { Typography } from '@/components/ui/typography'
import { SafeAccountsTable, type SafeAccountColumnId } from '@/features/myAccounts'
import { isMultiChainSafeItem, useSafesSearch, type AllSafeItems, type SafeItem } from '@/hooks/safes'
import type { SafeRef } from './types'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import { useSpaceSafes } from '../../hooks/useSpaceSafes'
import SelectedCounter from '../SelectedCounter'
import useOnboardingSelection from '../SelectSafesOnboarding/hooks/useOnboardingSelection'
import { getMultiChainSafeId, getSafeId } from '../SelectSafesOnboarding/utils/safeIds'

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

export const seatsTooltip = (planName: string, limit: number): string =>
  `${planName} covers ${limit} Safe accounts. Safe accounts you leave out remain available outside the Workspace. You can swap them in any time.`

/** Trims the Workspace to the plan's seats before the plan is taken; the Safes deselected are removed from it. */
export default function SelectAccountsStep({
  title = 'Select Safe accounts for your plan',
  limit,
  planName,
  continueLabel = 'Continue to checkout',
  onBack,
  onContinue,
  isSubmitting,
  error,
}: {
  title?: string
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
  const removed = useMemo(
    () => leavesOf(allSafes).filter((safe) => !selectedKeys.has(getSafeId(safe))),
    [allSafes, selectedKeys],
  )

  return (
    <>
      <Typography variant="h3" as={DialogTitle}>
        {title}
      </Typography>

      <Alert variant="info">
        <AlertSeverityIcon variant="info" />
        <AlertTitle className="font-semibold">
          {planName} covers {limit} Safe accounts
        </AlertTitle>
        <AlertDescription>
          Safe accounts you leave out remain available in My accounts. You can swap them in any time.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Amber only while the selection still exceeds the plan; sitting exactly at the cap is the goal. */}
          <SelectedCounter
            count={seatCount}
            limit={limit}
            isAtLimit={isOverLimit}
            tooltip={seatsTooltip(planName, limit)}
          />
          <SearchInput
            className="flex-1"
            placeholder="by name, address or network"
            aria-label="Search Safe list"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="h-91">
          {!isLoading && items.length === 0 ? (
            <Typography align="center" color="muted" className="py-8">
              No Safe accounts match your search
            </Typography>
          ) : (
            <SafeAccountsTable
              items={items}
              columns={COLUMNS}
              embedded
              selection={{ selectedKeys, onToggle: handleToggle, isAtLimit }}
              data-testid="plan-safes-table"
            />
          )}
        </ScrollArea>
      </div>

      {isOverLimit ? (
        <Alert variant="warning">
          <AlertSeverityIcon variant="warning" />
          <AlertDescription>
            Deselect {seatCount - limit === 1 ? '1 Safe account' : `${seatCount - limit} Safe accounts`} to fit the
            plan.
          </AlertDescription>
        </Alert>
      ) : (
        removed.length > 0 && (
          <Alert variant="warning">
            <AlertSeverityIcon variant="warning" />
            <AlertDescription>
              {removed.length === 1 ? '1 Safe account' : `${removed.length} Safe accounts`} will be removed from the
              Workspace. They remain available in My accounts.
            </AlertDescription>
          </Alert>
        )
      )}

      {error && (
        <Alert variant="destructive">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-5">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button
          size="lg"
          accentIcon
          className="flex-1"
          disabled={selectedKeys.size === 0 || isOverLimit || isSubmitting}
          onClick={() => onContinue(removed.map(({ chainId, address }) => ({ chainId, address })))}
        >
          {continueLabel}
          <ArrowRight />
        </Button>
      </div>
    </>
  )
}
