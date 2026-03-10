import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  List,
  ListItem,
  Box,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { SelectableItem } from '../../hooks/useSafeSelectionModal.types'

interface SelectAllConfirmDialogProps {
  open: boolean
  similarAddresses: SelectableItem[]
  onConfirm: () => void
  onCancel: () => void
}

const SelectAllConfirmDialog = ({ open, similarAddresses, onConfirm, onCancel }: SelectAllConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Similar addresses detected</DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {similarAddresses.length} Safe{similarAddresses.length === 1 ? '' : 's'} in your list closely resemble other
            addresses. Review them carefully before continuing.
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
          {similarAddresses.map((item) => (
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
        <Button onClick={onCancel} variant="text">
          No, skip similar addresses
        </Button>
        <Button onClick={onConfirm} variant="contained" startIcon={<WarningAmberIcon color="warning" />}>
          Yes, include them anyway
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SelectAllConfirmDialog
