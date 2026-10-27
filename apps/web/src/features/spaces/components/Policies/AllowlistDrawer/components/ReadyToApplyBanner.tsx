import type { ReactElement } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'

export type ReadyToApplyBannerProps = {
  title: string
  line2: string
  /** e.g. `6 days left · apply by Oct 20, 2026`; unset when the apply window is unknown. */
  applyBy?: string
}

const ReadyToApplyBanner = ({ title, line2, applyBy }: ReadyToApplyBannerProps): ReactElement => (
  <Alert variant="info" outlined={false}>
    <AlertSeverityIcon variant="info" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>
      <div>{line2}</div>
      {applyBy && <div data-testid="ready-apply-by">{applyBy}</div>}
    </AlertDescription>
  </Alert>
)

export default ReadyToApplyBanner
