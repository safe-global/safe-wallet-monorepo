import type { ReactElement } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'

export type PendingBannerProps = {
  title: string
  line2?: string
}

const PendingBanner = ({ title, line2 }: PendingBannerProps): ReactElement => (
  <Alert variant="warning" outlined={false}>
    <AlertSeverityIcon variant="warning" />
    <AlertTitle>{title}</AlertTitle>
    {line2 && <AlertDescription data-testid="pending-banner-line-2">{line2}</AlertDescription>}
  </Alert>
)

export default PendingBanner
