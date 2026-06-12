import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import SecurityBanner from './SecurityBanner'
import TrustedSafesList from './TrustedSafesList'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import SelectAllConfirmDialog from './SelectAllConfirmDialog'
import type { UseTrustedSafesModalReturn } from './useTrustedSafesModal'

interface TrustedSafesModalProps {
  modal: UseTrustedSafesModalReturn
}

const TrustedSafesModal = ({ modal }: TrustedSafesModalProps) => {
  const {
    isOpen,
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
    close,
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

  const pendingItem = pendingConfirmation
    ? availableItems.find((s) => s.address.toLowerCase() === pendingConfirmation)
    : null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-[min(900px,calc(100vw-2rem))] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
            <DialogTitle className="font-bold">Manage trusted Safes</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4">
            <SecurityBanner title="Verify before you trust" />

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedCount} of {totalSafesCount} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAll} disabled={allSelected || isLoading}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAll} disabled={selectedCount === 0 || isLoading}>
                  Deselect All
                </Button>
              </div>
            </div>

            <TrustedSafesList
              items={availableItems}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggle={toggleSelection}
            />
          </div>

          <DialogFooter className="shrink-0 flex-row justify-end border-t border-border px-6 pb-6 pt-4">
            <Button onClick={close} variant="ghost">
              Cancel
            </Button>
            <Button onClick={submitSelection} disabled={!hasChanges}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default TrustedSafesModal
