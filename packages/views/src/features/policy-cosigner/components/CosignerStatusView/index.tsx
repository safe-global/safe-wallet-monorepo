import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Spinner } from '@safe-global/views/components/ui/spinner'

export type CosignerStatusTone = 'info' | 'success' | 'warning' | 'destructive'

export type CosignerStatusViewProps = {
  tone: CosignerStatusTone
  title: string
  message: string
  loading?: boolean
}

const CosignerStatusView = ({ tone, title, message, loading = false }: CosignerStatusViewProps) => (
  <Alert variant={tone} data-testid="cosigner-status">
    {loading ? <Spinner /> : <AlertSeverityIcon variant={tone} />}
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
)

export default CosignerStatusView
