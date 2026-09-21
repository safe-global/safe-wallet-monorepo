import { type ReactElement, type ReactNode } from 'react'
import { getGsCodeFromError } from '@safe-global/utils/services/exceptions/contractErrors'
import { getGuardErrorInfo, isRevertError } from '@/utils/transaction-errors'
import { decodeCustomError } from '@/utils/customErrorRegistry'
import { getBlockExplorerLink } from '@/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import ExternalLink from '@/components/common/ExternalLink'
import ErrorDetails from '@/components/common/ErrorDetails'
import { getLedgerDeviceError, getLedgerSupportReference } from '@/services/onboard/ledger-errors'
import { Alert, AlertDescription, AlertTitle, AlertSeverityIcon } from '@/components/ui/alert'
import { cn } from '@/utils/cn'

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
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()

  // No alert ever shows the raw payload: it is a dump of provider URLs, calldata, library
  // versions and class names, and it goes to Sentry instead. An on-chain (GS) error and an
  // unmapped Ledger state carry a code-only support reference (WA-3005 / WA-3243).
  const gsCode = error ? getGsCodeFromError(error) : undefined

  const ledgerError = error ? getLedgerDeviceError(error) : undefined
  const ledgerReference = ledgerError?.reason === 'unknown' ? getLedgerSupportReference(ledgerError) : undefined

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
        </span>

        {effectiveGsCode ? (
          <ErrorDetails code={effectiveGsCode} customError={customError} />
        ) : (
          ledgerReference && <ErrorDetails code={ledgerReference} />
        )}
      </AlertDescription>
    </Alert>
  )
}

export default ErrorMessage
