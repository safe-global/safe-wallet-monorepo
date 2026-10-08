import NextLink from 'next/link'

import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { AppRoutes } from '@/config/routes'
import WarningIcon from '@/public/images/notifications/warning.svg'

import css from './styles.module.css'
import CircularIcon from '@/components/common/icons/CircularIcon'
import ExternalLink from '@/components/common/ExternalLink'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'

export type ErrorBoundaryViewProps = {
  error: Error
  componentStack: string
  isProduction: boolean
}

export const ErrorBoundaryView = ({ error, componentStack, isProduction }: ErrorBoundaryViewProps) => {
  return (
    <div className={css.container}>
      <div className={css.wrapper}>
        <Typography variant="h3" className="text-[var(--color-text-primary)]">
          Something went wrong,
          <br />
          please try again.
        </Typography>

        <CircularIcon icon={WarningIcon} badgeColor="warning" />

        {isProduction ? (
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
        <Link href={AppRoutes.index} className="mt-4" render={<NextLink href={AppRoutes.index} />}>
          Go home
        </Link>
      </div>
    </div>
  )
}
