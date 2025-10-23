import { type ReactElement, type ReactNode, type SyntheticEvent, useState } from 'react'
import { Link, Typography, SvgIcon, AlertTitle } from '@mui/material'
import classNames from 'classnames'
import WarningIcon from '@/public/images/notifications/warning.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { isGuardError } from '@/utils/transaction-errors'
import { getBlockExplorerLink } from '@/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import ExternalLink from '@/components/common/ExternalLink'
import css from './styles.module.css'

const ETHERS_PREFIX = 'could not coalesce error'

const ErrorMessage = ({
  children,
  error,
  className,
  level = 'error',
  title,
  context,
}: {
  children: ReactNode
  error?: Error
  className?: string
  level?: 'error' | 'warning' | 'info'
  title?: string
  context?: 'estimation' | 'execution'
}): ReactElement => {
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()

  // Check if this is a Guard error that should get special treatment
  const isGuardErrorResult = error && context && isGuardError(error)
  const guardExplorerLink =
    isGuardErrorResult && safe.guard && chain ? getBlockExplorerLink(chain, safe.guard.value) : undefined

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

            {isGuardErrorResult && (
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                <strong>
                  {guardExplorerLink ? (
                    <>
                      <ExternalLink href={guardExplorerLink.href}>Guard</ExternalLink> reverted the transaction
                      (UnapprovedHash)
                    </>
                  ) : (
                    <>Guard reverted the transaction (UnapprovedHash)</>
                  )}
                </strong>
              </Typography>
            )}

            {error && (
              <Link
                component="button"
                onClick={onDetailsToggle}
                sx={{
                  display: 'block',
                  mt: isGuardErrorResult ? 0.5 : 0,
                }}
              >
                Details
              </Link>
            )}
          </Typography>

          {error && showDetails && (
            <Typography variant="body2" className={css.details}>
              {error.message.replace(ETHERS_PREFIX, '').trim().slice(0, 500)}
            </Typography>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage
