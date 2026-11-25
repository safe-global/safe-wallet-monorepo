import type { ReactElement } from 'react'
import NextLink, { type LinkProps } from 'next/link'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Link } from '@safe-global/views/components/ui/link'

export type PendingBannerProps = {
  title: string
  line2?: string
  /** Follows the second line, to the page where the user does what it asks. */
  link?: { label: string; href: LinkProps['href'] }
}

const PendingBanner = ({ title, line2, link }: PendingBannerProps): ReactElement => (
  <Alert variant="warning" outlined={false}>
    <AlertSeverityIcon variant="warning" />
    <AlertTitle>{title}</AlertTitle>
    {line2 && (
      <AlertDescription data-testid="pending-banner-line-2">
        {line2}
        {link && (
          <>
            {' '}
            <Link render={<NextLink href={link.href} />} variant="inherit" data-testid="pending-banner-link">
              {link.label}
            </Link>
          </>
        )}
      </AlertDescription>
    )}
  </Alert>
)

export default PendingBanner
