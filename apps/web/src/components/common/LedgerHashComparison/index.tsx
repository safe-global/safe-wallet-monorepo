import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EthHashInfo from '@/components/common/EthHashInfo'
import ExternalStore from '@safe-global/utils/services/ExternalStore'

// External store for Ledger hash comparison
const ledgerHashStore = new ExternalStore<string | undefined>(undefined)

export const showLedgerHashComparison = (hash: string) => {
  ledgerHashStore.setStore(hash)
}

const LedgerHashComparison = () => {
  const hash = ledgerHashStore.useStore()
  const [open, setOpen] = useState(false)

  // Open dialog when hash is set
  if (hash && !open) {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    ledgerHashStore.setStore(undefined)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Compare transaction hash</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Compare this hash with the one displayed on your Ledger device before confirming the transaction.
        </Alert>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Transaction hash:
        </Typography>
        <EthHashInfo address={hash} showCopyButton shortAddress={false} showAvatar={false} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" sx={{ m: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LedgerHashComparison
