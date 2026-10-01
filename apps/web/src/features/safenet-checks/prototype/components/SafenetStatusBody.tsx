import type { ReactElement, ReactNode, Ref } from 'react'
import { Typography } from '@/components/ui/typography'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as HnQueueAssessment)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { PHASE_PRESENTATION, formatElapsed, getEtaCopy, isRunningPhase } from '../copy'
import type { SafenetCheckState } from '../types'

export type SafenetStatusBodyProps = {
  state: SafenetCheckState
  nowMs: number
  title?: string
  /** Extra content under the status, e.g. the explainer disclosure. */
  children?: ReactNode
  /** The live status region, focusable so a surface can move focus to a new verdict. */
  statusRef?: Ref<HTMLDivElement>
}

/** Icon, status sentence, running time and risk details: the anatomy every Safenet surface shares. */
export const SafenetStatusBody = ({
  state,
  nowMs,
  title,
  children,
  statusRef,
}: SafenetStatusBodyProps): ReactElement => {
  const { severity, copy, muted } = PHASE_PRESENTATION[state.phase]
  const isRunning = isRunningPhase(state.phase)
  const statusCopy = state.phase === 'checking' ? `${copy} · ${getEtaCopy(state.etaMs, nowMs)}` : copy

  return (
    <div className="flex items-start gap-2" data-testid="safenet-status" data-phase={state.phase}>
      <SeverityIcon severity={severity} muted={muted} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && (
          <Typography variant="paragraph-small" className="font-bold leading-4">
            {title}
          </Typography>
        )}

        <div ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
          <Typography variant="paragraph-small" color="muted">
            {statusCopy}
          </Typography>
        </div>

        {state.riskDetails && (
          <Typography variant="paragraph-small" data-testid="safenet-risk-details">
            {state.riskDetails}
          </Typography>
        )}

        {isRunning && state.startedAtMs !== undefined && (
          <Typography variant="paragraph-mini" color="muted" className="tabular-nums">
            Running for {formatElapsed(nowMs - state.startedAtMs)}
          </Typography>
        )}

        {children}
      </div>
    </div>
  )
}
