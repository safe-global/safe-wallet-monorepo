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
import CopyButton from '@/components/common/CopyButton'
import ledgerHashStore from '../../store/ledgerHashStore'
import {
  DIALOG_MAX_WIDTH,
  DIALOG_TITLE,
  DIALOG_DESCRIPTION,
  CLOSE_BUTTON_TEXT,
  HASH_DISPLAY_WIDTH,
  HASH_DISPLAY_LIMIT,
} from '../../constants'

const LedgerHashComparison = () => {
  const hash = ledgerHashStore.useStore()
  const open = !!hash

  const handleClose = () => {
    ledgerHashStore.setStore(undefined)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={DIALOG_MAX_WIDTH} fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">{DIALOG_TITLE}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          {DIALOG_DESCRIPTION}
        </Alert>

        <Stack justifyContent="center" alignItems="center" direction="row">
          <Paper
            sx={{ maxWidth: HASH_DISPLAY_WIDTH, boxSizing: 'content-box', px: 12, py: 1, position: 'relative' }}
            elevation={3}
          >
            <HexEncodedData hexData={hash || ''} highlightFirstBytes={false} limit={HASH_DISPLAY_LIMIT} />

            <Box position="absolute" top={2} right={2}>
              <CopyButton text={hash || ''} />
            </Box>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" sx={{ m: 2, mt: 0 }}>
          {CLOSE_BUTTON_TEXT}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LedgerHashComparison
