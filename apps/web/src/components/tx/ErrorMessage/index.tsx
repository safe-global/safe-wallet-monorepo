import { type ReactElement, type ReactNode, type SyntheticEvent, useState } from 'react'
import { getGsCodeFromError } from '@safe-global/utils/services/exceptions/contractErrors'
import { getGuardErrorInfo, isRevertError } from '@/utils/transaction-errors'
import { decodeCustomError } from '@/utils/customErrorRegistry'
import { getBlockExplorerLink } from '@/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import ExternalLink from '@/components/common/ExternalLink'
import ErrorDetails from '@/components/common/ErrorDetails'
import { Alert, AlertDescription, AlertTitle, AlertSeverityIcon } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { cn } from '@/utils/cn'

const ETHERS_PREFIX = 'could not coalesce error'

const alertVariant: Record<'error' | 'warning' | 'info', 'destructive' | 'warning' | 'info'> = {
  error: 'destructive',
  warning: 'warning',
  info: 'info',
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

  // On-chain (GS) errors show an always-visible, code-only support reference;
  // every other error keeps its raw message behind the Details toggle, as
  // before (WA-3005 is on-chain-scoped).
  const gsCode = error ? getGsCodeFromError(error) : undefined

  // GS013 family: the inner call reverted with a module/guard custom error. A
  // custom-error revert without a GS string is still a GS013 — decode its
  // selector against the known ABIs; undecodable ones keep the raw selector in
  // the support reference, never in the message.
  const customError =
    error && (gsCode === 'GS013' || (!gsCode && isRevertError(error))) ? decodeCustomError(error) : undefined
  const effectiveGsCode = gsCode ?? (customError ? 'GS013' : undefined)

  // Check if this is a Guard error that should get special treatment
  const guardErrorName = error && context ? getGuardErrorInfo(error) : undefined
  const guardExplorerLink =
    guardErrorName && safe.guard && chain ? getBlockExplorerLink(chain, safe.guard.value) : undefined

  const onDetailsToggle = (e: SyntheticEvent) => {
    e.preventDefault()
    setShowDetails((prev) => !prev)
  }

  return (
    <Alert
      data-testid="error-message"
      variant={alertVariant[level]}
      outlined={false}
      className={cn('errorMessage', className)}
    >
      <AlertSeverityIcon variant={alertVariant[level]} />

      {title && <AlertTitle>{title}</AlertTitle>}

      <AlertDescription>
        <span>
          {children}

          {guardErrorName && (
            <span className="mt-2 block">
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

          {error && !effectiveGsCode && (
            <Link
              render={<button type="button" />}
              onClick={onDetailsToggle}
              className={cn('block', guardErrorName && 'mt-1')}
            >
              Details
            </Link>
          )}
        </span>

        {effectiveGsCode ? (
          <ErrorDetails code={effectiveGsCode} customError={customError} />
        ) : (
          error &&
          showDetails && (
            <Typography variant="paragraph-small" color="muted" className="mt-2 block break-words">
              {error.message.replace(ETHERS_PREFIX, '').trim().slice(0, 500)}
            </Typography>
          )
        )}
      </AlertDescription>
    </Alert>
  )
}

export default ErrorMessage
