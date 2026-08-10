import { type ReactElement, type ReactNode, type SyntheticEvent, useMemo, useState } from 'react'
import { Link, Typography, SvgIcon, AlertTitle } from '@mui/material'
import classNames from 'classnames'
import { buildSupportReference } from '@safe-global/utils/services/exceptions/supportReference'
import WarningIcon from '@/public/images/notifications/warning.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { getGuardErrorInfo } from '@/utils/transaction-errors'
import { getBlockExplorerLink } from '@/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import ExternalLink from '@/components/common/ExternalLink'
import ErrorDetails from '@/components/common/ErrorDetails'
import css from './styles.module.css'

const ErrorMessage = ({
  children,
  error,
  className,
  level = 'error',
  title,
  context,
  txHash,
}: {
  children: ReactNode
  error?: Error
  className?: string
  level?: 'error' | 'warning' | 'info'
  title?: string
  context?: 'estimation' | 'execution'
  txHash?: string
}): ReactElement => {
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()

  // Build a support reference from the error — never surface the raw payload.
  const supportReference = useMemo(
    () => (error ? buildSupportReference(error, { network: chain?.chainName, txHash }) : undefined),
    [error, chain?.chainName, txHash],
  )

  // Check if this is a Guard error that should get special treatment
  const guardErrorName = error && context ? getGuardErrorInfo(error) : undefined
  const guardExplorerLink =
    guardErrorName && safe.guard && chain ? getBlockExplorerLink(chain, safe.guard.value) : undefined

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

            {guardErrorName && (
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                <strong>
                  {guardExplorerLink ? (
                    <>
                      <ExternalLink href={guardExplorerLink.href}>Guard</ExternalLink> reverted the transaction (
                      {guardErrorName})
                    </>
                  ) : (
                    <>Guard reverted the transaction ({guardErrorName})</>
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
                  mt: guardErrorName ? 0.5 : 0,
                }}
              >
                Details
              </Link>
            )}
          </Typography>

          {supportReference && showDetails && <ErrorDetails reference={supportReference} />}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage
