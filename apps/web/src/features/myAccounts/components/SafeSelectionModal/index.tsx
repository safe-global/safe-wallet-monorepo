import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Alert,
  Typography,
  List,
  ListItem,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SecurityBanner from './SecurityBanner'
import SafeSelectionList from './SafeSelectionList'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import EthHashInfo from '@/components/common/EthHashInfo'
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>Manage trusted Safes</Box>
          <IconButton onClick={close} size="small" edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <SecurityBanner title="Verify Safes before confirming" />

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

        <DialogActions sx={{ px: 3, pb: 3 }}>
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
      <Dialog open={pendingSelectAllConfirmation} onClose={cancelSelectAll} maxWidth="sm" fullWidth>
        <DialogTitle>Similar addresses detected</DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {similarAddressesForSelectAll.length} Safe{similarAddressesForSelectAll.length === 1 ? '' : 's'} in your
              list closely resemble other addresses. Review them carefully before continuing.
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The following addresses have been flagged as similar:
          </Typography>

          <List
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'border.light',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {similarAddressesForSelectAll.map((item) => (
              <ListItem key={item.address} sx={{ py: 1 }}>
                <Box sx={{ width: '100%' }}>
                  <EthHashInfo address={item.address} showCopyButton shortAddress={false} showAvatar avatarSize={24} />
                  {item.name && (
                    <Typography variant="caption" color="text.secondary">
                      {item.name}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Do you want to include these addresses in your selection?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={cancelSelectAll} variant="text">
            No, skip similar addresses
          </Button>
          <Button onClick={confirmSelectAll} variant="contained" startIcon={<WarningAmberIcon color="warning" />}>
            Yes, include them anyway
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SafeSelectionModal
