import ModalDialog from '@/components/common/ModalDialog'
import { AppRoutes } from '@/config/routes'
import CSVAirdropLogo from '@/public/images/apps/csv-airdrop-app-logo.svg'
import { Button, DialogActions, DialogContent, Grid, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'

const CSVAirdropAppModal = ({ onClose, appUrl }: { onClose: () => void; appUrl?: string }): ReactElement => {
  const router = useRouter()

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
      {appUrl && (
        <DialogActions style={{ textAlign: 'center', display: 'block' }}>
          <Link
            href={{
              pathname: AppRoutes.apps.open,
              query: {
                safe: router.query.safe,
                appUrl,
              },
            }}
            passHref
          >
            <Button variant="contained" data-testid="open-app-btn">
              Open CSV Airdrop
            </Button>
          </Link>
        </DialogActions>
      )}
    </ModalDialog>
  )
}

export default CSVAirdropAppModal
