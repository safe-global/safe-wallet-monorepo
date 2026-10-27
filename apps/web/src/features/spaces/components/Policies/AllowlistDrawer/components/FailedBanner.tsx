import type { ReactElement } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'

export type FailedBannerProps = {
  title: string
  line2: string
}

const FailedBanner = ({ title, line2 }: FailedBannerProps): ReactElement => (
  <Alert variant="destructive" outlined={false}>
    <AlertSeverityIcon variant="destructive" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{line2}</AlertDescription>
  </Alert>
)

export default FailedBanner
