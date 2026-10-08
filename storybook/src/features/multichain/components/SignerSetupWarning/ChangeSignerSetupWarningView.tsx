import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'

export type ChangeSignerSetupWarningViewProps = {
  chainName?: string
}

export const ChangeSignerSetupWarningView = ({ chainName }: ChangeSignerSetupWarningViewProps) => {
  return (
    <Alert variant="info" className="my-0 border-none">
      <AlertSeverityIcon variant="info" />
      <AlertDescription>
        {`Signers are not consistent across networks on this account. Changing signers will only affect the account on ${chainName}`}
      </AlertDescription>
    </Alert>
  )
}
