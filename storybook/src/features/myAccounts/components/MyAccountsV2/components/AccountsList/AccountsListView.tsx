import type { ReactNode } from 'react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Typography } from '@/components/ui/typography'

export type AccountsListViewProps = {
  isSearching: boolean
  resultCount: number
  searchResults: ReactNode
  showCurrentSafe: boolean
  currentSafeTable: ReactNode
  showPinnedSafes: boolean
  pinnedSafesTable: ReactNode
}

export const AccountsListView = ({
  isSearching,
  resultCount,
  searchResults,
  showCurrentSafe,
  currentSafeTable,
  showPinnedSafes,
  pinnedSafesTable,
}: AccountsListViewProps) => {
  if (isSearching) {
    return (
      <>
        <Typography variant="paragraph-small" color="muted" className="block mb-2">
          Found {resultCount} result{maybePlural(resultCount)}
        </Typography>
        {searchResults}
      </>
    )
  }

  return (
    <>
      {showCurrentSafe && (
        <section data-testid="current-safe-section" className="mb-6">
          <Typography variant="paragraph-small-bold" className="block mb-2">
            Current Safe account
          </Typography>
          {currentSafeTable}
        </section>
      )}

      {showPinnedSafes && <section data-testid="pinned-accounts">{pinnedSafesTable}</section>}
    </>
  )
}
