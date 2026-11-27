import type { ReactElement } from 'react'
import StatusAlert, { type StatusAlertProps } from '@safe-global/views/components/common/StatusAlert'

type DismissibleCalloutProps = Omit<StatusAlertProps, 'tone' | 'onDismiss'> & {
  tone?: StatusAlertProps['tone']
  onDismiss: () => void
}

/** A hint the user can close; the caller holds the dismissed state and stops rendering it. */
const DismissibleCallout = ({ tone = 'warning', ...props }: DismissibleCalloutProps): ReactElement => (
  <StatusAlert tone={tone} {...props} />
)

export default DismissibleCallout
