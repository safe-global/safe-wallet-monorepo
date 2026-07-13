import { useMemo } from 'react'
import { ChevronLeft, Info, Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { useIsQualifiedSafe } from '@/features/spaces'
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import type { AllSafeItems } from '@/hooks/safes'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  OrderByOption,
  selectOrderByPreference,
  setManualOrder,
  TRUSTED_ORDER_SCOPE,
} from '@/store/orderByPreferenceSlice'
import SecurityBanner from './SecurityBanner'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import SelectAllConfirmDialog from './SelectAllConfirmDialog'
import { isSelectableMultiChainSafe } from './useTrustedSafesModal.types'
import type { UseTrustedSafesModalReturn } from './useTrustedSafesModal'

const MANAGE_COLUMNS: SafeAccountColumnId[] = ['select', 'name', 'threshold', 'networks', 'balance']

// Repo scrollbar convention: thin, rounded, themed thumb on a transparent track.
const SCROLL_AREA =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-none pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border'

interface ManageTrustedSafesContentProps {
  modal: UseTrustedSafesModalReturn
  secondaryLabel: 'Cancel' | 'Back'
  onSecondary: () => void
  /** Called after a successful save — lets an embedding modal switch views without closing. */
  onSaved?: () => void
}

/**
 * The "Manage trusted Safes" view: a selectable table of all owned/known safes, backed entirely
 * by `useTrustedSafesModal`. Rendered both as a standalone dialog body and embedded inside the
 * workspace "Add accounts" modal, so it owns no shell (header/dialog) of its own.
 */
const ManageTrustedSafesContent = ({ modal, secondaryLabel, onSecondary, onSaved }: ManageTrustedSafesContentProps) => {
  const {
    availableItems,
    pendingConfirmation,
    pendingSelectAllConfirmation,
    similarAddressesForSelectAll,
    searchQuery,
    isLoading,
    hasChanges,
    totalSafesCount,
    selectedCount,
    allSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    confirmSimilarAddress,
    cancelSimilarAddress,
    confirmSelectAll,
    skipSimilarSelectAll,
    cancelSelectAll,
    submitSelection,
    setSearchQuery,
  } = modal

  const isInSpace = useIsQualifiedSafe()
  const isDarkMode = useDarkMode()
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  // Reordering shares the trusted list's Manual order (same scope as the workspace accounts list).
  // Suppressed while searching: a drop then would persist only the filtered subset, dropping the
  // hidden addresses from the saved order.
  const canReorder = orderBy === OrderByOption.MANUAL && !searchQuery

  const pendingItem = pendingConfirmation
    ? availableItems.find((s) => s.address.toLowerCase() === pendingConfirmation)
    : null

  // availableItems already reflects the search filter and selection overlay from the hook.
  const items: AllSafeItems = availableItems

  const selectedKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const item of availableItems) {
      if (isSelectableMultiChainSafe(item)) {
        if (item.isSelected) item.safes.forEach((safe) => keys.add(`${safe.chainId}:${safe.address}`))
      } else if (item.isSelected) {
        keys.add(`${item.chainId}:${item.address}`)
      }
    }
    return keys
  }, [availableItems])

  const flaggedAddresses = useMemo(
    () => new Set(availableItems.filter((item) => item.similarityGroup).map((item) => item.address.toLowerCase())),
    [availableItems],
  )

  const someSelected = selectedCount > 0

  const handleSave = () => {
    submitSelection()
    onSaved?.()
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <SecurityBanner title="Verify before you trust" />

          {isInSpace && (
            <Alert className="mb-4 border-transparent bg-[var(--color-info-background)]" data-testid="space-notice">
              <Info />
              <AlertDescription className="text-current">
                Trusted Safes aren&apos;t added to this workspace automatically — add them separately.
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-3 flex items-center gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={someSelected && !allSelected ? 'mixed' : allSelected}
              aria-label="Select all"
              onClick={() => (allSelected ? deselectAll() : selectAll())}
              disabled={isLoading || totalSafesCount === 0}
              data-testid="manage-trusted-select-all"
              className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} tabIndex={-1} aria-hidden />
              Select all · {selectedCount} of {totalSafesCount} selected
            </button>
            <div className="flex flex-1 items-center justify-end gap-3">
              <InputGroup className="max-w-sm flex-1 rounded-md border-gray-100 bg-card shadow-none">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="by name, address or network"
                  aria-label="Search Safes by name, address or network"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  data-testid="manage-trusted-search-input"
                />
              </InputGroup>
              <ShadcnProvider dark={isDarkMode} className="flex shrink-0 items-center">
                <SafeListSortToggle />
              </ShadcnProvider>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No safes found matching your search' : 'No safes available'}
          </div>
        ) : (
          <div className={SCROLL_AREA}>
            <SafeAccountsTable
              items={items}
              columns={MANAGE_COLUMNS}
              flaggedAddresses={flaggedAddresses}
              selection={{
                selectedKeys,
                onToggle: (line: AccountLine) => toggleSelection(line.address),
              }}
              reorder={
                canReorder
                  ? { onReorder: (order) => dispatch(setManualOrder({ scope: TRUSTED_ORDER_SCOPE, order })) }
                  : undefined
              }
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex shrink-0 flex-row items-center gap-3 border-t border-border pt-4">
        <Button onClick={onSecondary} variant="secondary" size="lg" className="flex-1">
          {secondaryLabel === 'Back' && <ChevronLeft className="size-4" />}
          {secondaryLabel}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          size="lg"
          className="flex-1"
          data-testid="manage-trusted-save"
        >
          Save
        </Button>
      </div>

      {pendingItem && (
        <SimilarityConfirmDialog
          open={Boolean(pendingConfirmation)}
          safe={pendingItem}
          onConfirm={confirmSimilarAddress}
          onCancel={cancelSimilarAddress}
        />
      )}

      <SelectAllConfirmDialog
        open={pendingSelectAllConfirmation}
        similarAddresses={similarAddressesForSelectAll}
        onConfirm={confirmSelectAll}
        onSkip={skipSimilarSelectAll}
        onCancel={cancelSelectAll}
      />
    </>
  )
}

export default ManageTrustedSafesContent
