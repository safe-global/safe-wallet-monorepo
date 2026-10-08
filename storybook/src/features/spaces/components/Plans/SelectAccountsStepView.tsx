import type { ReactElement, ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SearchInput } from '@/components/ui/search-input'
import { Typography } from '@/components/ui/typography'
import Track from '@/components/common/Track'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import SelectedCounter from '../SelectedCounter'
import { removedSafesNote, type RemovedSafesSummary } from './removedSafes'

export const seatsTooltip = (planName: string, limit: number): string =>
  `${planName} covers ${limit} Safe accounts. Safe accounts you leave out remain available in My accounts. You can swap them in any time.`

export type SelectAccountsStepViewProps = {
  limit: number
  planName: string
  continueLabel?: string
  onBack: () => void
  onContinue: () => void
  isSubmitting?: boolean
  error?: string
  query: string
  onQueryChange: (query: string) => void
  /** No Safe matches the search once the Safes have loaded. */
  isEmpty: boolean
  table: ReactNode
  seatCount: number
  selectedCount: number
  /** Analytics params of the continue button. */
  submitTrackingParams: Record<string, unknown>
  isOverLimit: boolean
  removedSummary: RemovedSafesSummary
}

export const SelectAccountsStepView = ({
  limit,
  planName,
  continueLabel = 'Continue to checkout',
  onBack,
  onContinue,
  isSubmitting,
  error,
  query,
  onQueryChange,
  isEmpty,
  table,
  seatCount,
  selectedCount,
  submitTrackingParams,
  isOverLimit,
  removedSummary,
}: SelectAccountsStepViewProps): ReactElement => {
  const removedNote = removedSafesNote(removedSummary)

  return (
    <>
      <Typography variant="h3" as={DialogTitle}>
        {highlightSafePro('Select Safe accounts for your Safe Pro plan')}
      </Typography>

      <Alert variant="info">
        <AlertSeverityIcon variant="info" />
        <AlertTitle className="font-semibold">
          {planName} covers {limit} Safe accounts
        </AlertTitle>
        <AlertDescription>
          At {limit}, deselect one to add another. Safe accounts you leave out remain available in My accounts.
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
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>

        <ScrollArea className="h-91">
          {isEmpty ? (
            <Typography align="center" color="muted" className="py-8">
              No Safe accounts match your search
            </Typography>
          ) : (
            table
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
        removedNote && (
          <Alert variant="warning">
            <AlertSeverityIcon variant="warning" />
            <AlertDescription>{removedNote}</AlertDescription>
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
        <Track
          {...SAFE_PRO_EVENTS.SAFE_ACCOUNT_SELECTION_SUBMITTED}
          mixpanelParams={submitTrackingParams}
          as="div"
          className="flex-1"
        >
          <Button
            size="lg"
            accentIcon
            className="w-full"
            disabled={selectedCount === 0 || isOverLimit || isSubmitting}
            onClick={onContinue}
          >
            {continueLabel}
            <ArrowRight />
          </Button>
        </Track>
      </div>
    </>
  )
}
