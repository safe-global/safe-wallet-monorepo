import type { ReactElement } from 'react'
import type { UrlObject } from 'url'
import NextLink from 'next/link'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Link } from '@/components/ui/link'

export type NestedSafeGrantNoticeProps = {
  safeName: string
  parentSafeName: string
  /** Omitted when the Safe's chain is unknown, so there is no settings page to open. */
  settingsHref?: UrlObject
}

const NestedSafeGrantNotice = ({
  safeName,
  parentSafeName,
  settingsHref,
}: NestedSafeGrantNoticeProps): ReactElement => (
  <Alert variant="warning" outlined={false} data-testid="nested-safe-grant-notice">
    <AlertSeverityIcon variant="warning" />
    <AlertTitle>Remove this proposer on the Safe account level</AlertTitle>
    <AlertDescription>
      <p>
        The parent Safe account, {parentSafeName}, granted this proposer role on {safeName}. To remove it, open the
        settings of {safeName} with a signer of {parentSafeName}.
      </p>
      {settingsHref && <Link render={<NextLink href={settingsHref} />}>Go to Safe settings</Link>}
    </AlertDescription>
  </Alert>
)

export default NestedSafeGrantNotice
