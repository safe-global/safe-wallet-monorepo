import type { MouseEvent, ReactElement } from 'react'
import type { UrlObject } from 'url'
import NextLink from 'next/link'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Link } from '@/components/ui/link'

export type ParentSafeWalletNoticeViewProps = {
  title: string
  /** Completes "To … on its behalf", e.g. "grant this role". */
  action: string
  safeName: string
  parentSafeName: string
  settingsHref?: UrlObject
  onGoToSettings: (event: MouseEvent<HTMLAnchorElement>) => void
}

export const ParentSafeWalletNoticeView = ({
  title,
  action,
  safeName,
  parentSafeName,
  settingsHref,
  onGoToSettings,
}: ParentSafeWalletNoticeViewProps): ReactElement => (
  <Alert variant="warning" outlined={false} data-testid="parent-safe-wallet-notice">
    <AlertSeverityIcon variant="warning" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>
      <p>
        Your connected wallet, {parentSafeName}, is a parent Safe account of {safeName}. To {action} on its behalf, open
        the settings of {safeName} with a signer of {parentSafeName}.
      </p>
      {settingsHref && (
        <Link
          render={<NextLink href={settingsHref} />}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={onGoToSettings}
        >
          Go to Safe settings
        </Link>
      )}
    </AlertDescription>
  </Alert>
)
