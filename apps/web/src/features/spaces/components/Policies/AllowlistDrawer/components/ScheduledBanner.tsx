import type { ReactElement } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'

export type ScheduledBannerProps = {
  title: string
  line2: string
  appliesAt: string
}

const ScheduledBanner = ({ title, line2, appliesAt }: ScheduledBannerProps): ReactElement => (
  <Alert variant="warning" outlined={false}>
    <AlertSeverityIcon variant="warning" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>
      <div>{line2}</div>
      <div data-testid="scheduled-applies-at">{appliesAt}</div>
    </AlertDescription>
  </Alert>
)

export default ScheduledBanner
