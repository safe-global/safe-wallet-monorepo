import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import Rocket from '@/public/images/common/rocket.svg'

export type CreateSafeStatusViewProps = {
  statusMessage: ReactNode
  // Kept falsy-number semantics of `counter && ...` so a 0 counter renders as before
  showSpeedUpWarning: number | boolean | undefined
  isError: boolean
  onCancel: () => void
  onTryAgain: () => void
}

export function CreateSafeStatusView({
  statusMessage,
  showSpeedUpWarning,
  isError,
  onCancel,
  onTryAgain,
}: CreateSafeStatusViewProps): ReactElement {
  return (
    <div className="bg-card text-card-foreground overflow-hidden rounded-xl text-center">
      <div className="p-4 sm:p-16">
        {statusMessage}

        {showSpeedUpWarning && (
          <Alert variant="warning" outlined={false} className="mt-10">
            <Rocket />
            <AlertTitle className="text-left font-bold">Transaction is taking too long</AlertTitle>
            <AlertDescription className="text-left">
              Try to speed it up with better gas parameters in your wallet.
            </AlertDescription>
          </Alert>
        )}

        {isError && (
          <div className="flex flex-row justify-center gap-4">
            <Button variant="outline" onClick={onCancel} render={<Link href={AppRoutes.index} />}>
              Go to homepage
            </Button>
            <Button variant="default" onClick={onTryAgain}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
