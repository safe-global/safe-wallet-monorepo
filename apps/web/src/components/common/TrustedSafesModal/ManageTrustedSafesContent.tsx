import { useEffect, useMemo, useState } from 'react'
import { ConnectWalletHint } from '@/features/spaces'
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import type { AllSafeItems } from '@/hooks/safes'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import { useDarkMode } from '@/hooks/useDarkMode'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { OrderByOption, selectOrderByPreference, TRUSTED_ORDER_SCOPE } from '@/store/orderByPreferenceSlice'
import { useSaveManualOrder } from '@/hooks/safes'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import SelectAllConfirmDialog from './SelectAllConfirmDialog'
import { isSelectableMultiChainSafe } from './useTrustedSafesModal.types'
import type { UseTrustedSafesModalReturn } from './useTrustedSafesModal'
import { ManageTrustedSafesContentView } from '@views/components/common/TrustedSafesModal/ManageTrustedSafesContentView'

const MANAGE_COLUMNS: SafeAccountColumnId[] = ['select', 'name', 'threshold', 'networks', 'balance']

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
    similarityGroups,
    anchorAddresses,
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

  const wallet = useWallet()
  const isDarkMode = useDarkMode()
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const saveManualOrder = useSaveManualOrder(TRUSTED_ORDER_SCOPE)

  // Rendering hundreds of account rows takes ~1s and blocks the dialog's first paint. Defer the table
  // past one painted frame (double rAF) so the shell + spinner show immediately, then the rows fill in.
  const [showTable, setShowTable] = useState(false)
  useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShowTable(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [])

  // Reordering shares the trusted list's Manual order (same scope as the workspace accounts list)
  // and is offered in every sort mode — dragging switches the mode to Manual. Suppressed while
  // searching: a drop then would persist only the filtered subset, dropping the hidden addresses
  // from the saved order.
  const canReorder = !searchQuery

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

  const someSelected = selectedCount > 0

  const handleSave = () => {
    submitSelection()
    onSaved?.()
  }

  return (
    <ManageTrustedSafesContentView
      connectWalletHint={!wallet && <ConnectWalletHint testId="manage-trusted-connect-wallet-button" />}
      allSelected={allSelected}
      someSelected={someSelected}
      selectedCount={selectedCount}
      totalSafesCount={totalSafesCount}
      isLoading={isLoading}
      onToggleSelectAll={() => (allSelected ? deselectAll() : selectAll())}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      isDarkMode={isDarkMode}
      sortToggle={<SafeListSortToggle />}
      showSpinner={isLoading || !showTable}
      isEmpty={items.length === 0}
      table={
        <SafeAccountsTable
          items={items}
          columns={MANAGE_COLUMNS}
          similarityGroups={similarityGroups}
          anchorAddresses={anchorAddresses}
          allowRenameInDialog
          // Column sorting is only offered in Name mode; Last visited / Manual own the order.
          sortableColumns={orderBy === OrderByOption.NAME}
          selection={{
            selectedKeys,
            onToggle: (line: AccountLine) => toggleSelection(line.address),
          }}
          reorder={canReorder ? { onReorder: saveManualOrder } : undefined}
        />
      }
      secondaryLabel={secondaryLabel}
      onSecondary={onSecondary}
      onSave={handleSave}
      hasChanges={hasChanges}
      dialogs={
        <>
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
      }
    />
  )
}

export default ManageTrustedSafesContent
