import type { ReactElement } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'

export type ActivatedBannerProps = {
  title: string
  line2: string
}

const ActivatedBanner = ({ title, line2 }: ActivatedBannerProps): ReactElement => (
  <Alert variant="success">
    <AlertSeverityIcon variant="success" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{line2}</AlertDescription>
  </Alert>
)

export default ActivatedBanner
