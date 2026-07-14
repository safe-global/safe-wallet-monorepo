import ModalDialog from '@/components/common/ModalDialog'
import { AppRoutes } from '@/config/routes'
import CSVAirdropLogo from '@/public/images/apps/csv-airdrop-app-logo.svg'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
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
      <div className="mt-6 px-6 pb-5 text-center">
        <div>
          <CSVAirdropLogo />
          <Typography variant="paragraph-bold" className="mt-4 mb-4">
            Use CSV Airdrop
          </Typography>
          <Typography variant="paragraph-small" className="block">
            You&apos;ve reached the limit of 5 recipients. To add more use CSV Airdrop, where you can simply upload you
            CSV file and send to endless number of recipients.
          </Typography>
        </div>
      </div>
      {appUrl && (
        <div className="block p-2 text-center">
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
            <Button data-testid="open-app-btn">Open CSV Airdrop</Button>
          </Link>
        </div>
      )}
    </ModalDialog>
  )
}

export default CSVAirdropAppModal
