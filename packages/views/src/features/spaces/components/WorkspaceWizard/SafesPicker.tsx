import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { Typography } from '@safe-global/views/components/ui/typography'
import SelectedCounter, { safeLimitTooltip } from '@safe-global/views/features/spaces/components/SelectedCounter'
import type { SafeLimit } from '@safe-global/views/features/spaces/components/SelectedCounter/types'

type SafesPickerProps = {
  /** Shown above the list, e.g. a prompt to connect a wallet. */
  hint?: ReactNode
  hasNoSafes: boolean
  hasNoResults: boolean
  seatCount: number
  limit: SafeLimit
  isAtLimit: boolean
  onSearch: (query: string) => void
  list: ReactNode
  error: string | null
}

/** The Safe selection of the onboarding: a seat counter, a search box and the list of the user's Safes. */
const SafesPicker = ({
  hint,
  hasNoSafes,
  hasNoResults,
  seatCount,
  limit,
  isAtLimit,
  onSearch,
  list,
  error,
}: SafesPickerProps) => (
  <>
    {hint}

    {hasNoSafes ? (
      <Alert variant="info" className="shrink-0">
        <AlertSeverityIcon variant="info" />
        <AlertDescription>You don&apos;t have any safes yet</AlertDescription>
      </Alert>
    ) : (
      <>
        <div className="flex shrink-0 items-center gap-3">
          <SelectedCounter count={seatCount} limit={limit} isAtLimit={isAtLimit} tooltip={safeLimitTooltip(limit)} />
          <SearchInput
            className="flex-1"
            placeholder="by name, address or network"
            aria-label="Search Safe list"
            autoComplete="off"
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>

        <div className="relative min-w-0" data-testid="onboarding-safes-list-region">
          {hasNoResults ? (
            <Typography variant="paragraph" align="center" color="muted" className="py-8">
              No safes match your search
            </Typography>
          ) : (
            list
          )}
        </div>
      </>
    )}

    {error && (
      <Alert variant="destructive" className="shrink-0" data-testid="safes-limit-error">
        <AlertSeverityIcon variant="destructive" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
  </>
)

export default SafesPicker
