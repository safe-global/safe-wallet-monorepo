import type { ReactElement } from 'react'
import type { UrlObject } from 'url'
import NextLink from 'next/link'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Link } from '@/components/ui/link'

export type ParentSafeWalletCopy = {
  title: string
  /** Completes "To … on its behalf", e.g. "grant this role". */
  action: string
}

export type ParentSafeWalletNoticeProps = ParentSafeWalletCopy & {
  safeName: string
  parentSafeName: string
  settingsHref?: UrlObject
  /** Runs before the settings link navigates; the tx modal's navigation guard listens on mousedown. */
  onNavigate?: () => void
}

const ParentSafeWalletNotice = ({
  title,
  action,
  safeName,
  parentSafeName,
  settingsHref,
  onNavigate,
}: ParentSafeWalletNoticeProps): ReactElement => (
  <Alert variant="warning" outlined={false} data-testid="parent-safe-wallet-notice">
    <AlertSeverityIcon variant="warning" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>
      <p>
        Your connected wallet, {parentSafeName}, is a parent Safe account of {safeName}. To {action} on its behalf, open
        the settings of {safeName} with a signer of {parentSafeName}.
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
