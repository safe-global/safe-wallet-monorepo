import { useState, type ReactElement } from 'react'
import { X } from 'lucide-react'
import { Alert, AlertAction, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CALLOUT_DESCRIPTION, CALLOUT_DISMISS_LABEL, CALLOUT_TITLE } from '../constants'

/** Dismissal lives with the mounted flow only: the intro dialog already remembers "seen" across sessions. */
const SpenderCallout = (): ReactElement | null => {
  const [open, setOpen] = useState(true)
  if (!open) return null

  return (
    <Alert variant="info" data-testid="spender-callout">
      <AlertSeverityIcon variant="info" />
      <AlertTitle>{CALLOUT_TITLE}</AlertTitle>
      <AlertDescription>{CALLOUT_DESCRIPTION}</AlertDescription>
      <AlertAction>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={CALLOUT_DISMISS_LABEL}
          onClick={() => setOpen(false)}
        >
          <X />
        </Button>
      </AlertAction>
    </Alert>
  )
}

export default SpenderCallout
