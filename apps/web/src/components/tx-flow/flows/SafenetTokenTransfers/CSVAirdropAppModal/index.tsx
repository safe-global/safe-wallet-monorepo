import ModalDialog from '@/components/common/ModalDialog'
import CSVAirdropLogo from '@/public/images/apps/csv-airdrop-app-logo.svg'
import { Button, DialogActions, DialogContent, Grid, Typography } from '@mui/material'
import router from 'next/router'
import type { ReactElement } from 'react'

const CSVAirdropAppModal = ({ onClose, appUrl }: { onClose: () => void; appUrl?: string }): ReactElement => {
  const openApp = () => {
    if (appUrl) {
      router.push(`/apps/open?appUrl=${decodeURIComponent(appUrl)}`)
    }
  }

  return (
    <ModalDialog
      data-testid="csvairdrop-dialog"
      open
      onClose={onClose}
      dialogTitle="Limit reached"
      hideChainIndicator
      maxWidth="xs"
    >
      <DialogContent sx={{ mt: 3, textAlign: 'center' }}>
        <Grid>
          <CSVAirdropLogo />
          <Typography fontWeight="bold" sx={{ mt: 2, mb: 2 }}>
            Use CSV Airdrop
          </Typography>
          <Typography variant="body2">
            You&apos;ve reached the limit of 5 recipients. To add more use CSV Airdrop, where you can simply upload you
            CSV file and send to endless number of recipients.
          </Typography>
        </Grid>
      </DialogContent>
      <DialogActions style={{ textAlign: 'center', display: 'block' }}>
        <Button variant="contained" data-testid="open-app-btn" onClick={openApp}>
          Open CSV Airdrop
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default CSVAirdropAppModal
