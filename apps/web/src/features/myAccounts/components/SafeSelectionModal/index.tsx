import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
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
      <Dialog open={isOpen} onClose={close} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            borderBottom: '1px solid',
            borderColor: 'border.light',
            px: 3,
            pt: 3,
            pb: 2,
          }}
        >
          <Box>Manage trusted Safes</Box>
          <IconButton onClick={close} size="small" edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ maxHeight: '60vh', overflowY: 'auto', pt: '16px !important' }}>
          <SecurityBanner title="Verify before you trust" />

          {/* Selection controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedCount} of {totalSafesCount} selected
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" onClick={selectAll} disabled={allSelected || isLoading}>
                Select All
              </Button>
              <Button size="small" variant="outlined" onClick={deselectAll} disabled={selectedCount === 0 || isLoading}>
                Deselect All
              </Button>
            </Box>
          </Box>

          <SafeSelectionList
            items={availableItems}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggle={toggleSelection}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'border.light',
          }}
        >
          <Button onClick={close} variant="text">
            Cancel
          </Button>
          <Button onClick={submitSelection} variant="contained" disabled={!hasChanges}>
            Save
          </Button>
        </DialogActions>
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
