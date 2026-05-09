import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Typography, Box } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { SelectableItem } from '../../hooks/useSafeSelectionModal.types'

interface SimilarityConfirmDialogProps {
  open: boolean
  safe: SelectableItem
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog for selecting an address flagged as similar to another address
 * Warns user about potential address poisoning attack
 */
const SimilarityConfirmDialog = ({ open, safe, onConfirm, onCancel }: SimilarityConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Similar address detected</DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This address is similar to another safe in your list. This could indicate an address poisoning attack.
          </Typography>
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Selected safe
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'border.light',
            }}
          >
            <EthHashInfo address={safe.address} showCopyButton shortAddress={false} showAvatar avatarSize={32} />
            {safe.name && (
              <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                Name: {safe.name}
              </Typography>
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Verify the full address carefully. Continue only if you recognize this Safe.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} variant="text">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" startIcon={<WarningAmberIcon color="warning" />}>
          I understand, continue anyway
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SimilarityConfirmDialog
