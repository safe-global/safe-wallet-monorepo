import type { ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export type NonPinnedWarningViewProps = {
  onAddClick: () => void
  dialog: ReactNode
}

export const NonPinnedWarningView = ({ onAddClick, dialog }: NonPinnedWarningViewProps) => {
  return (
    <>
      <Alert variant="warning" outlined={false} data-testid="non-pinned-warning">
        <AlertSeverityIcon variant="warning" />
        <AlertTitle className="font-bold">Not in your accounts</AlertTitle>
        <AlertDescription>
          You&apos;re a signer of this Safe, but you haven&apos;t added it to your accounts yet. Adding it helps you
          recognize it and reduces the risk of impersonation.
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-foreground"
              data-testid="trust-this-safe-button"
              onClick={onAddClick}
            >
              Add to my accounts
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {dialog}
    </>
  )
}
