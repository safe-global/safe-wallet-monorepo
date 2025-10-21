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
  Stack,
  Paper,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import ledgerHashStore from './store'
import CopyButton from '@/components/common/CopyButton'

const LedgerHashComparison = () => {
  const hash = ledgerHashStore.useStore()
  const open = !!hash

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
        <Alert severity="info" sx={{ mb: 3 }}>
          Compare this hash with the one displayed on your Ledger device before confirming the transaction.
        </Alert>

        <Stack justifyContent="center" alignItems="center" direction="row">
          <Paper
            sx={{ maxWidth: '180px', boxSizing: 'content-box', px: 12, py: 1, position: 'relative' }}
            elevation={3}
          >
            <HexEncodedData hexData={hash || ''} highlightFirstBytes={false} limit={9999} />

            <Box position="absolute" top={2} right={2}>
              <CopyButton text={hash || ''} />
            </Box>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" sx={{ m: 2, mt: 0 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LedgerHashComparison
