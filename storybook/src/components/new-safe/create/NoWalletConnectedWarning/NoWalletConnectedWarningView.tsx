import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'

export type ConnectWalletButtonSlotProps = {
  variant: 'outline'
  className: string
}

export type NoWalletConnectedWarningViewProps = {
  renderConnectWalletButton: (props: ConnectWalletButtonSlotProps) => ReactNode
}

export function NoWalletConnectedWarningView({
  renderConnectWalletButton,
}: NoWalletConnectedWarningViewProps): ReactElement {
  return (
    <Alert variant="warning" outlined={false} className="mt-6">
      <AlertSeverityIcon variant="warning" />
      <AlertTitle className="font-bold">No wallet connected</AlertTitle>
      <AlertDescription>
        You need to connect a wallet to create a Safe account.
        <div className="mt-4">{renderConnectWalletButton({ variant: 'outline', className: 'text-foreground' })}</div>
      </AlertDescription>
    </Alert>
  )
}
