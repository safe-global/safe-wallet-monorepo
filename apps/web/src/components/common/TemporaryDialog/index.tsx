import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { ReactElement } from 'react'
import ExternalLink from '../ExternalLink'

export function TemporaryDialog(): ReactElement {
  const [open, setOpen] = useState(true)

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open}>
      <DialogTitle>Security notice</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography color="text.primary">
            Due to recent security incidents it is important to ALWAYS verify transactions that you are approving on
            your signer wallet. If you can’t verify it, don’t sign it.
          </Typography>

          <Typography color="text.primary" mt={1}>
            More information on how to verify a Safe transaction can be found in the{' '}
            <ExternalLink href="https://help.safe.global/en/articles/276343-how-to-perform-basic-transactions-checks-on-safe-wallet">
              corresponding help center article
            </ExternalLink>
            .
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Box m={1}>
          <Button onClick={handleClose} variant="contained">
            I understand
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}
