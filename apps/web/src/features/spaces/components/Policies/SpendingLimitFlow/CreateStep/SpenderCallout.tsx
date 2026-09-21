import type { ReactElement } from 'react'
import { X } from 'lucide-react'
import { Alert, AlertAction, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CALLOUT_DESCRIPTION, CALLOUT_DISMISS_LABEL, CALLOUT_TITLE } from '../constants'

export type SpenderCalloutProps = {
  /** Held above `TxFlow`: this step unmounts on Next, so local state would forget the dismissal on Back. */
  dismissed: boolean
  onDismiss: () => void
}

const SpenderCallout = ({ dismissed, onDismiss }: SpenderCalloutProps): ReactElement | null => {
  if (dismissed) return null

  return (
    <Alert variant="info" data-testid="spender-callout">
      <AlertSeverityIcon variant="info" />
      <AlertTitle>{CALLOUT_TITLE}</AlertTitle>
      <AlertDescription>{CALLOUT_DESCRIPTION}</AlertDescription>
      <AlertAction>
        <Button type="button" variant="ghost" size="icon-xs" aria-label={CALLOUT_DISMISS_LABEL} onClick={onDismiss}>
          <X />
        </Button>
      </AlertAction>
    </Alert>
  )
}

export default SpenderCallout
