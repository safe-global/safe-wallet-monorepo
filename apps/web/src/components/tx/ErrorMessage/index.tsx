import { type ReactElement, type ReactNode, type SyntheticEvent, useState } from 'react'
import classNames from 'classnames'
import WarningIcon from '@/public/images/notifications/warning.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { getGuardErrorInfo } from '@/utils/transaction-errors'
import { getBlockExplorerLink } from '@/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

const ETHERS_PREFIX = 'could not coalesce error'

const iconColorClass: Record<'error' | 'warning' | 'info', string> = {
  error: 'text-[var(--color-error-main)]',
  warning: 'text-[var(--color-warning-main)]',
  info: 'text-[var(--color-info-main)]',
}

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
  const guardErrorName = error && context ? getGuardErrorInfo(error) : undefined
  const guardExplorerLink =
    guardErrorName && safe.guard && chain ? getBlockExplorerLink(chain, safe.guard.value) : undefined

  const onDetailsToggle = (e: SyntheticEvent) => {
    e.preventDefault()
    setShowDetails((prev) => !prev)
  }

  const Icon = level === 'info' ? InfoIcon : WarningIcon

  return (
    <div data-testid="error-message" className={classNames(css.container, css[level], className, 'errorMessage')}>
      <div className={css.message}>
        <Icon className={cn('size-6 shrink-0 fill-current', iconColorClass[level])} />

        <div>
          <Typography variant="paragraph-small">
            {title && (
              <span className="block font-bold">
                <span className="text-base leading-6 font-bold">{title}</span>
              </span>
            )}
            {children}

            {guardErrorName && (
              <span className="mt-2 block text-sm leading-5">
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
              </span>
            )}

            {error && (
              <Link
                render={<button type="button" />}
                onClick={onDetailsToggle}
                className={cn('block', guardErrorName && 'mt-1')}
              >
                Details
              </Link>
            )}
          </Typography>

          {error && showDetails && (
            <Typography variant="paragraph-small" className={cn('block', css.details)}>
              {error.message.replace(ETHERS_PREFIX, '').trim().slice(0, 500)}
            </Typography>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage
