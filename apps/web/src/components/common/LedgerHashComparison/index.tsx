import { useState, useEffect } from 'react'
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
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import ExternalStore from '@safe-global/utils/services/ExternalStore'

// External store for Ledger hash comparison
const ledgerHashStore = new ExternalStore<string | undefined>(undefined)

export const showLedgerHashComparison = (hash: string) => {
  ledgerHashStore.setStore(hash)
}

export const hideLedgerHashComparison = () => {
  ledgerHashStore.setStore(undefined)
}

const LedgerHashComparison = () => {
  const hash = ledgerHashStore.useStore()
  const [open, setOpen] = useState(false)

  // Open dialog when hash is set, close when cleared
  useEffect(() => {
    if (hash) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [hash])

  const handleClose = () => {
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
        <Box sx={{ maxWidth: '550px' }}>
          <HexEncodedData hexData={hash || ''} title="Transaction hash" highlightFirstBytes={false} limit={9999} />
        </Box>
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
