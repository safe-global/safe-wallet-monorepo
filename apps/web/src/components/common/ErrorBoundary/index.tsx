import { Typography, Link } from '@mui/material'

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
        <Typography
          variant="h3"
          sx={{
            color: 'text.primary',
          }}
        >
          Something went wrong,
          <br />
          please try again.
        </Typography>

        <CircularIcon icon={WarningIcon} badgeColor="warning" />

        {IS_PRODUCTION ? (
          <Typography
            sx={{
              color: 'text.primary',
            }}
          >
            In case the problem persists, please reach out to us via our{' '}
            <ExternalLink href={HELP_CENTER_URL}>Help Center</ExternalLink>
          </Typography>
        ) : (
          <>
            {/* Error may be undefined despite what the type says */}
            <Typography color="error">{error?.toString()}</Typography>
            <Typography color="error">{componentStack}</Typography>
          </>
        )}
        <Link
          href={AppRoutes.welcome.index}
          color="primary"
          sx={{
            mt: 2,
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  )
}

export default ErrorBoundary
