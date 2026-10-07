import type { ReactElement } from 'react'
import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { getActionNote } from '../copy'
import type { SafenetCheckState, SafenetSignerRole } from '../types'
import { useFlowSafenetCheck } from '../useFlowSafenetCheck'

export type SafenetCardCaptionViewProps = {
  state: SafenetCheckState
  role: SafenetSignerRole
  nowMs: number
}

/** Safenet note above the Sign or Execute button. Advisory: it never disables the action. */
export const SafenetCardCaptionView = ({ state, role, nowMs }: SafenetCardCaptionViewProps): ReactElement => {
  const { text, isRisk } = getActionNote(state.phase, role, { etaMs: state.etaMs, nowMs })

  if (isRisk) {
    return (
      <Alert variant="destructive" className="mt-4" data-testid="safenet-card-caption" data-phase={state.phase}>
        <AlertSeverityIcon variant="destructive" />
        <AlertDescription>{text}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div data-testid="safenet-card-caption" data-phase={state.phase} className="mt-4 flex items-start gap-2">
      <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <Typography variant="paragraph-mini" color="muted" aria-live="polite">
        {text}
      </Typography>
    </div>
  )
}

export const SafenetCardCaption = (): ReactElement | null => {
  const { check, role } = useFlowSafenetCheck()
  if (!check) return null

  return <SafenetCardCaptionView state={check.state} role={role} nowMs={check.nowMs} />
}

export default SafenetCardCaption
