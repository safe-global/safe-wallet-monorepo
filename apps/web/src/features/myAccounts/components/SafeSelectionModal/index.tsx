import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import SecurityBanner from './SecurityBanner'
import SafeSelectionList from './SafeSelectionList'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import SelectAllConfirmDialog from './SelectAllConfirmDialog'
import type { UseSafeSelectionModalReturn } from '../../hooks/useSafeSelectionModal'

interface SafeSelectionModalProps {
  modal: UseSafeSelectionModalReturn
}

/**
 * Modal for selecting safes to pin to the trusted list
 *
 * Shows a security warning banner, list of available safes with selection,
 * and handles similarity confirmation for flagged addresses.
 */
const SafeSelectionModal = ({ modal }: SafeSelectionModalProps) => {
  const {
    isOpen,
    availableItems,
    selectedAddresses,
    pendingConfirmation,
    pendingSelectAllConfirmation,
    similarAddressesForSelectAll,
    searchQuery,
    isLoading,
    hasChanges,
    totalSafesCount,
    close,
    toggleSelection,
    selectAll,
    deselectAll,
    confirmSimilarAddress,
    cancelSimilarAddress,
    confirmSelectAll,
    cancelSelectAll,
    submitSelection,
    setSearchQuery,
  } = modal

  const pendingItem = pendingConfirmation
    ? availableItems.find((s) => s.address.toLowerCase() === pendingConfirmation)
    : null

  const allSelected = totalSafesCount > 0 && selectedAddresses.size === totalSafesCount
  const selectedCount = selectedAddresses.size

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-border border-b font-bold">
            <DialogTitle>Manage trusted Safes</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto p-4">
            <SecurityBanner title="Verify before you trust" />

            {/* Selection controls */}
            <div className="mb-4 flex items-center justify-between">
              <Typography variant="paragraph-small" color="muted">
                {selectedCount} of {totalSafesCount} selected
              </Typography>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAll} disabled={allSelected || isLoading}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAll} disabled={selectedCount === 0 || isLoading}>
                  Deselect All
                </Button>
              </div>
            </div>

            <SafeSelectionList
              items={availableItems}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggle={toggleSelection}
            />
          </div>

          <DialogFooter className="border-border flex-row justify-end border-t">
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={submitSelection} disabled={!hasChanges}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for selecting individual similar address */}
      {pendingItem && (
        <SimilarityConfirmDialog
          open={Boolean(pendingConfirmation)}
          safe={pendingItem}
          onConfirm={confirmSimilarAddress}
          onCancel={cancelSimilarAddress}
        />
      )}

      {/* Confirmation dialog for Select All with similar addresses */}
      <SelectAllConfirmDialog
        open={pendingSelectAllConfirmation}
        similarAddresses={similarAddressesForSelectAll}
        onConfirm={confirmSelectAll}
        onCancel={cancelSelectAll}
      />
    </>
  )
}

export default SafeSelectionModal
