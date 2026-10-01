import { useContext, type ReactElement } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { cn } from '@/utils/cn'
import { PHASE_PRESENTATION, getEtaCopy } from '../copy'
import type { SafenetCheckState } from '../types'
import { resolveRole, useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'

export const getStepperNote = (state: SafenetCheckState, nowMs: number): string => {
  if (state.phase === 'before-sign') return 'Safenet checks after you sign'
  const label = `Safenet: ${PHASE_PRESENTATION[state.phase].label.toLowerCase()}`
  return state.phase === 'checking' ? `${label} · ${getEtaCopy(state.etaMs, nowMs)}` : label
}

export type SafenetStepperNoteViewProps = {
  state: SafenetCheckState
  nowMs: number
  className?: string
}

export const SafenetStepperNoteView = ({ state, nowMs, className }: SafenetStepperNoteViewProps): ReactElement => (
  <span
    data-testid="safenet-stepper-note"
    data-phase={state.phase}
    className={cn('text-xs leading-4 text-muted-foreground', state.phase === 'risk' && 'text-error-strong', className)}
  >
    {getStepperNote(state, nowMs)}
  </span>
)

/** Safenet status under the signing step of the tx flow's left rail. The Shield row owns the announcements. */
export const SafenetStepperNote = ({ className }: { className?: string }): ReactElement | null => {
  const { isCreation, willExecute, onlyExecute } = useContext(TxFlowContext)
  const { scenario } = useSafenetScenario()
  const check = useSafenetCheckState(resolveRole(scenario.role, { isCreation, willExecute, onlyExecute }))
  if (!check) return null

  return <SafenetStepperNoteView state={check.state} nowMs={check.nowMs} className={className} />
}

export default SafenetStepperNote
