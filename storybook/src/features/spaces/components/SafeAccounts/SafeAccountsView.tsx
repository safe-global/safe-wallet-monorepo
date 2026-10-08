import type { ReactElement, ReactNode } from 'react'
import { TriangleAlert, RotateCw, Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Typography } from '@/components/ui/typography'
import { SPACE_LABELS, SPACE_EVENTS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import SecurityBanner from '@/components/common/TrustedSafesModal/SecurityBanner'
import EmptySafeAccounts from './EmptySafeAccounts'
import SelectedCounter from '../SelectedCounter'
import { seatsTooltip } from '../Plans/PlanStatusCardView'

export type SafeAccountsViewProps = {
  previewInvite?: ReactNode
  showSeatLimitBanner: boolean
  renderSeatLimitBanner: (props: { className: string }) => ReactNode
  /** Set on a Safe Pro plan with a seat limit. */
  seatCounter?: { usedSeats: number; limit: number; isAtLimit: boolean; tierName?: string }
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  renderSortToggle: (props: { size: 'lg'; className: string }) => ReactNode
  isAdmin: boolean
  renderAddAccounts: (props: { buttonVariant: 'default'; buttonLabel: string }) => ReactElement
  isError: boolean
  /** The load error's own message, if it has one. */
  errorMessage?: string
  onRetry: () => void
  isEmpty: boolean
  hasResults: boolean
  hasSimilarAddresses: boolean
  table: ReactNode
}

export const SafeAccountsView = ({
  previewInvite,
  showSeatLimitBanner,
  renderSeatLimitBanner,
  seatCounter,
  searchQuery,
  onSearchQueryChange,
  renderSortToggle,
  isAdmin,
  renderAddAccounts,
  isError,
  errorMessage,
  onRetry,
  isEmpty,
  hasResults,
  hasSimilarAddresses,
  table,
}: SafeAccountsViewProps): ReactElement => (
  <>
    {previewInvite}
    <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
      Safe accounts
    </Typography>

    {showSeatLimitBanner && renderSeatLimitBanner({ className: 'mb-6' })}

    <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
      {!isEmpty && !isError && (
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          {seatCounter && (
            <SelectedCounter
              count={seatCounter.usedSeats}
              limit={seatCounter.limit}
              isAtLimit={seatCounter.isAtLimit}
              showSelected={false}
              tooltip={seatsTooltip(seatCounter.tierName, seatCounter.limit)}
            />
          )}
          <InputGroup variant="search" inputSize="lg" className="flex-1">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="by name, address or network"
              aria-label="Search Safe accounts by name, address or network"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              autoComplete="off"
              data-testid="space-safe-accounts-search-input"
            />
          </InputGroup>
          {renderSortToggle({
            size: 'lg',
            className: 'border-border shadow-xs hover:bg-foreground/[0.06] aria-expanded:bg-foreground/[0.06]',
          })}
        </div>
      )}
      {isAdmin && (
        <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.accounts_page}>
          {renderAddAccounts({ buttonVariant: 'default', buttonLabel: 'Add accounts' })}
        </Track>
      )}
    </div>

    {isError ? (
      <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4">
        <TriangleAlert className="size-5 shrink-0 text-destructive" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-destructive">Failed to load Safe accounts</span>
          <span className="text-xs text-muted-foreground">
            {errorMessage !== undefined ? errorMessage : 'Please try again.'}
          </span>
        </div>
        <button
          onClick={onRetry}
          className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          type="button"
        >
          <RotateCw className="size-3.5" />
          Retry
        </button>
      </div>
    ) : isEmpty ? (
      <EmptySafeAccounts />
    ) : !hasResults ? (
      <Typography variant="paragraph-small" color="muted" align="center" className="py-8">
        No Safe accounts match your search
      </Typography>
    ) : (
      <div className="flex flex-col gap-4">
        {hasSimilarAddresses && <SecurityBanner title="Verify before you trust" />}
        {table}
      </div>
    )}
  </>
)
