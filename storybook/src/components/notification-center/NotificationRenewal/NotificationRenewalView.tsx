import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RENEWAL_MESSAGE } from '@/components/settings/PushNotifications/constants'

export type NotificationRenewalViewProps = {
  isRegistering: boolean
  isDeployed: boolean
  onSign: () => void
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
}

export function NotificationRenewalView({
  isRegistering,
  isDeployed,
  onSign,
  renderCheckWallet,
}: NotificationRenewalViewProps): ReactElement {
  return (
    <>
      <Alert variant="warning" outlined={false}>
        <AlertSeverityIcon variant="warning" />
        <AlertTitle className="mb-2">Signature needed</AlertTitle>
        <AlertDescription>{RENEWAL_MESSAGE}</AlertDescription>
      </Alert>
      <div>
        {renderCheckWallet((isOk) => (
          <Button
            variant="outline"
            size="sm"
            className="w-[200px] text-foreground"
            onClick={onSign}
            disabled={!isOk || isRegistering || !isDeployed}
          >
            Sign now
          </Button>
        ))}
      </div>
    </>
  )
}
