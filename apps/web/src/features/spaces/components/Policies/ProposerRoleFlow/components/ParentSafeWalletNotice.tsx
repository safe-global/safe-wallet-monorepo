import type { ReactElement } from 'react'
import type { UrlObject } from 'url'
import NextLink from 'next/link'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Link } from '@/components/ui/link'

export type ParentSafeWalletNoticeProps = {
  safeName: string
  parentSafeName: string
  settingsHref?: UrlObject
  onNavigate?: () => void
}

const ParentSafeWalletNotice = ({
  safeName,
  parentSafeName,
  settingsHref,
  onNavigate,
}: ParentSafeWalletNoticeProps): ReactElement => (
  <Alert variant="warning" outlined={false} data-testid="parent-safe-wallet-notice">
    <AlertSeverityIcon variant="warning" />
    <AlertTitle>Add this proposer on the Safe account level</AlertTitle>
    <AlertDescription>
      <p>
        Your connected wallet, {parentSafeName}, is a parent Safe account of {safeName}. To grant this role on its
        behalf, open the settings of {safeName} with a signer of {parentSafeName}.
      </p>
      {settingsHref && (
        <Link render={<NextLink href={settingsHref} />} onMouseDown={onNavigate} onClick={onNavigate}>
          Go to Safe settings
        </Link>
      )}
    </AlertDescription>
  </Alert>
)

export default ParentSafeWalletNotice
