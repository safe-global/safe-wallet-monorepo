import { type ReactElement, type ReactNode } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import { Alert, AlertDescription, AlertTitle, AlertSeverityIcon } from '@/components/ui/alert'
import { cn } from '@/utils/cn'

const alertVariant: Record<'error' | 'warning' | 'info', 'destructive' | 'warning' | 'info'> = {
  error: 'destructive',
  warning: 'warning',
  info: 'info',
}

export type ErrorMessageViewProps = {
  children: ReactNode
  customClassName?: string
  level?: 'error' | 'warning' | 'info'
  title?: string
  guardErrorName?: string
  guardExplorerHref?: string
  details?: ReactNode
}

export const ErrorMessageView = ({
  children,
  customClassName,
  level = 'error',
  title,
  guardErrorName,
  guardExplorerHref,
  details,
}: ErrorMessageViewProps): ReactElement => {
  return (
    <Alert
      data-testid="error-message"
      variant={alertVariant[level]}
      outlined={false}
      className={cn('errorMessage', customClassName)}
    >
      <AlertSeverityIcon variant={alertVariant[level]} />

      {title && <AlertTitle>{title}</AlertTitle>}

      <AlertDescription>
        <span>
          {children}

          {guardErrorName && (
            <span className="mt-2 block">
              <strong>
                {guardExplorerHref ? (
                  <>
                    <ExternalLink href={guardExplorerHref}>Guard</ExternalLink> reverted the transaction (
                    {guardErrorName})
                  </>
                ) : (
                  <>Guard reverted the transaction ({guardErrorName})</>
                )}
              </strong>
            </span>
          )}
        </span>

        {details}
      </AlertDescription>
    </Alert>
  )
}
