import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SecurityBanner from './SecurityBanner'
import SafeSelectionList from './SafeSelectionList'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import SelectAllConfirmDialog from './SelectAllConfirmDialog'
import SelectionControls from './SelectionControls'
import type { UseSafeSelectionModalReturn } from '../../hooks/useSafeSelectionModal'

interface SafeSelectionModalProps {
  modal: UseSafeSelectionModalReturn
}

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
      <Dialog
        open={isOpen}
        onClose={close}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            '@media (max-width: 600px)': {
              width: '100%',
              margin: 0,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            Manage trusted Safes
          </Typography>
          <IconButton onClick={close} size="small" edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <SecurityBanner title="Verify Safes before confirming" />
          <SelectionControls
            selectedCount={selectedCount}
            totalCount={totalSafesCount}
            allSelected={allSelected}
            isLoading={isLoading}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
          />
          <SafeSelectionList
            items={availableItems}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggle={toggleSelection}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={close} variant="text">
            Cancel
          </Button>
          <Button onClick={submitSelection} variant="contained" disabled={!hasChanges}>
            Save
          </Button>
        </DialogActions>
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
        onCancel={cancelSelectAll}
      />
    </>
  )
}

export default SafeSelectionModal
