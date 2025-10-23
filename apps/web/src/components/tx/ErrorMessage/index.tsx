import { type ReactElement, type ReactNode, type SyntheticEvent, useState } from 'react'
import { Link, Typography, SvgIcon, AlertTitle } from '@mui/material'
import classNames from 'classnames'
import WarningIcon from '@/public/images/notifications/warning.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import css from './styles.module.css'

const ETHERS_PREFIX = 'could not coalesce error'

const ErrorMessage = ({
  children,
  error,
  className,
  level = 'error',
  title,
}: {
  children: ReactNode
  error?: Error & { reason?: string }
  className?: string
  level?: 'error' | 'warning' | 'info'
  title?: string
}): ReactElement => {
  const [showDetails, setShowDetails] = useState<boolean>(false)

  const onDetailsToggle = (e: SyntheticEvent) => {
    e.preventDefault()
    setShowDetails((prev) => !prev)
  }

  return (
    <div data-testid="error-message" className={classNames(css.container, css[level], className, 'errorMessage')}>
      <div className={css.message}>
        <SvgIcon
          component={level === 'info' ? InfoIcon : WarningIcon}
          inheritViewBox
          fontSize="medium"
          sx={{ color: ({ palette }) => `${palette[level].main} !important` }}
        />

        <div>
          <Typography variant="body2" component="span">
            {title && (
              <AlertTitle>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {title}
                </Typography>
              </AlertTitle>
            )}
            {children}

            {error && (
              <Link
                component="button"
                onClick={onDetailsToggle}
                sx={{
                  display: 'block',
                }}
              >
                Details
              </Link>
            )}
          </Typography>

          {error && showDetails && (
            <Typography variant="body2" className={css.details}>
              {(error.reason || error.message).replace(ETHERS_PREFIX, '').trim().slice(0, 500)}
            </Typography>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage
