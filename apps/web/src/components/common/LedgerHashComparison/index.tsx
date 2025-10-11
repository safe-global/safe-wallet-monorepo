import { useEffect, useState } from 'react'
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

// Custom event for Ledger hash comparison
export const LEDGER_HASH_EVENT = 'ledger-hash-comparison'

export type LedgerHashEvent = CustomEvent<{ hash: string }>

export const showLedgerHashComparison = (hash: string) => {
  const event = new CustomEvent(LEDGER_HASH_EVENT, { detail: { hash } })
  window.dispatchEvent(event)
}

const LedgerHashComparison = () => {
  const [open, setOpen] = useState(false)
  const [hash, setHash] = useState('')

  useEffect(() => {
    const handleLedgerHash = (event: Event) => {
      const { hash } = (event as LedgerHashEvent).detail
      setHash(hash)
      setOpen(true)
    }

    window.addEventListener(LEDGER_HASH_EVENT, handleLedgerHash)

    return () => {
      window.removeEventListener(LEDGER_HASH_EVENT, handleLedgerHash)
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
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
          Transaction Hash:
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
