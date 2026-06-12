import NextLink from 'next/link'

import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { IS_PRODUCTION } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import WarningIcon from '@/public/images/notifications/warning.svg'

import css from '@/components/common/ErrorBoundary/styles.module.css'
import CircularIcon from '../icons/CircularIcon'
import ExternalLink from '../ExternalLink'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
interface ErrorBoundaryProps {
  error: Error
  componentStack: string
}

const ErrorBoundary = ({ error, componentStack }: ErrorBoundaryProps) => {
  return (
    <div className={css.container}>
      <div className={css.wrapper}>
        <Typography variant="h3" className="text-[var(--color-text-primary)]">
          Something went wrong,
          <br />
          please try again.
        </Typography>

        <CircularIcon icon={WarningIcon} badgeColor="warning" />

        {IS_PRODUCTION ? (
          <Typography className="text-[var(--color-text-primary)]">
            In case the problem persists, please reach out to us via our{' '}
            <ExternalLink href={HELP_CENTER_URL}>Help Center</ExternalLink>
          </Typography>
        ) : (
          <>
            {/* Error may be undefined despite what the type says */}
            <Typography className="text-destructive">{error?.toString()}</Typography>
            <Typography className="text-destructive">{componentStack}</Typography>
          </>
        )}
        <Link href={AppRoutes.welcome.index} className="mt-4" render={<NextLink href={AppRoutes.welcome.index} />}>
          Go home
        </Link>
      </div>
    </div>
  )
}

export default ErrorBoundary
