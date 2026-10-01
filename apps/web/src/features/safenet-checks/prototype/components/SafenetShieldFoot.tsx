import { useContext, type ReactElement } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { CHECK_ETA_MS } from '../resolveCheckState'
import { getReadyCopy, getSecondsLeft } from '../copy'
import type { SafenetCheckState } from '../types'
import { resolveRole, useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'

export type SafenetShieldFootViewProps = {
  state: SafenetCheckState
  nowMs: number
}

/** Progress hairline and ETA under the Safenet item while a check runs. */
export const SafenetShieldFootView = ({ state, nowMs }: SafenetShieldFootViewProps): ReactElement => {
  const elapsedMs = state.startedAtMs === undefined ? 0 : nowMs - state.startedAtMs
  const progress = Math.min(100, Math.max(0, Math.round((elapsedMs / CHECK_ETA_MS) * 100)))

  return (
    <div data-testid="safenet-shield-foot" className="px-3 pb-3">
      <div
        role="progressbar"
        aria-label="Safenet check progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-[3px] overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-[var(--color-info-main)] transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-[11px] leading-4 whitespace-nowrap text-muted-foreground tabular-nums">
        {getReadyCopy(state.etaMs, nowMs)}
      </p>
    </div>
  )
}

/** `~43s` at the right of the Shield header while a check runs. */
export const SafenetHeaderEta = (): ReactElement | null => {
  const { isCreation, willExecute, onlyExecute } = useContext(TxFlowContext)
  const { scenario } = useSafenetScenario()
  const check = useSafenetCheckState(resolveRole(scenario.role, { isCreation, willExecute, onlyExecute }))
  if (!check || check.state.phase !== 'checking') return null
  const secondsLeft = getSecondsLeft(check.state.etaMs, check.nowMs)
  return secondsLeft > 0 ? <span className="tabular-nums">~{secondsLeft}s</span> : null
}
