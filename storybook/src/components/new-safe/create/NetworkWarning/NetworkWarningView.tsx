import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'

export type NetworkWarningViewProps = {
  action?: string
  chainName: string
  chainSwitcher: ReactNode
}

export function NetworkWarningView({ action, chainName, chainSwitcher }: NetworkWarningViewProps): ReactElement {
  return (
    <Alert variant="warning" outlined={false}>
      <AlertSeverityIcon variant="warning" />
      <AlertTitle className="font-bold">Change your wallet network</AlertTitle>
      <AlertDescription>
        You are trying to {action || 'sign or execute a transaction'} on {chainName}. Make sure that your wallet is set
        to the same network.
        <div className="mt-4">{chainSwitcher}</div>
      </AlertDescription>
    </Alert>
  )
}
