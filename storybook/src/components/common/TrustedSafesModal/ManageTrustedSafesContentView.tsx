import type { ReactElement, ReactNode } from 'react'
import { ChevronLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import SecurityBanner from './SecurityBanner'

// Repo scrollbar convention: thin, rounded, themed thumb on a transparent track.
const SCROLL_AREA =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-none pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border'

export type ManageTrustedSafesContentViewProps = {
  connectWalletHint?: ReactNode
  allSelected: boolean
  someSelected: boolean
  selectedCount: number
  totalSafesCount: number
  isLoading: boolean
  onToggleSelectAll: () => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  isDarkMode: boolean
  sortToggle: ReactNode
  showSpinner: boolean
  isEmpty: boolean
  table: ReactNode
  secondaryLabel: 'Cancel' | 'Back'
  onSecondary: () => void
  onSave: () => void
  hasChanges: boolean
  dialogs: ReactNode
}

export function ManageTrustedSafesContentView({
  connectWalletHint,
  allSelected,
  someSelected,
  selectedCount,
  totalSafesCount,
  isLoading,
  onToggleSelectAll,
  searchQuery,
  onSearchQueryChange,
  isDarkMode,
  sortToggle,
  showSpinner,
  isEmpty,
  table,
  secondaryLabel,
  onSecondary,
  onSave,
  hasChanges,
  dialogs,
}: ManageTrustedSafesContentViewProps): ReactElement {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <SecurityBanner title="Verify before you trust" />

          {connectWalletHint && <div className="mb-4">{connectWalletHint}</div>}

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={someSelected && !allSelected ? 'mixed' : allSelected}
              aria-label="Select all"
              onClick={onToggleSelectAll}
              disabled={isLoading || totalSafesCount === 0}
              data-testid="manage-trusted-select-all"
              className="flex shrink-0 items-center gap-2 rounded-md py-1 pl-[28px] pr-2 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} tabIndex={-1} aria-hidden />
              Select all · {selectedCount} of {totalSafesCount} selected
            </button>
            <div className="flex grow basis-72 items-center justify-end gap-3">
              <InputGroup variant="outline" className="max-w-sm flex-1">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="by name, address or network"
                  aria-label="Search Safes by name, address or network"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  autoComplete="off"
                  data-testid="manage-trusted-search-input"
                />
              </InputGroup>
              <ShadcnProvider dark={isDarkMode} className="flex shrink-0 items-center">
                {sortToggle}
              </ShadcnProvider>
            </div>
          </div>
        </div>

        {showSpinner ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : isEmpty ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No safes found matching your search' : 'No safes available'}
          </div>
        ) : (
          <div className={SCROLL_AREA}>{table}</div>
        )}
      </div>

      <div className="mt-4 flex shrink-0 flex-row items-center gap-3 border-t border-border pt-4">
        <Button onClick={onSecondary} variant="secondary" size="lg" className="flex-1">
          {secondaryLabel === 'Back' && <ChevronLeft className="size-4" />}
          {secondaryLabel}
        </Button>
        <Button onClick={onSave} disabled={!hasChanges} size="lg" className="flex-1" data-testid="manage-trusted-save">
          Save
        </Button>
      </div>

      {dialogs}
    </>
  )
}
