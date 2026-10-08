import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export type DelegationErrorBoundaryViewProps = {
  errorMessage: string
  fallbackMessage?: string
  showErrorDetails: boolean
  onRetry: () => void
}

export function DelegationErrorBoundaryView({
  errorMessage,
  fallbackMessage,
  showErrorDetails,
  onRetry,
}: DelegationErrorBoundaryViewProps): ReactElement {
  return (
    <div className="rounded-lg border border-[var(--color-error-main)] bg-[var(--color-error-background)] p-4">
      <Typography variant="paragraph-small" className="mb-1 block text-destructive">
        {fallbackMessage || 'Something went wrong loading this content.'}
      </Typography>
      {showErrorDetails && (
        <Typography variant="paragraph-mini" color="muted" className="mb-2 block whitespace-pre-wrap font-mono">
          {errorMessage}
        </Typography>
      )}
      <Button size="sm" variant="outline" className="text-destructive" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
