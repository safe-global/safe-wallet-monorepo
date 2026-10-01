import { useContext, type ReactElement } from 'react'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { CHECK_ETA_MS } from '../resolveCheckState'
import { SAFENET_EXPLAINER_COPY, SAFENET_EXPLAINER_TITLE, getReadyCopy, getSecondsLeft, isRunningPhase } from '../copy'
import type { SafenetCheckState } from '../types'
import { resolveRole, useSafenetCheckState } from '../useSafenetCheckState'
import { useSafenetScenario } from '../useSafenetScenario'

export type SafenetShieldFootViewProps = {
  state: SafenetCheckState
  nowMs: number
}

/** Progress hairline, ETA and the "why so long" explainer at the foot of the Shield panel while a check runs. */
export const SafenetShieldFootView = ({ state, nowMs }: SafenetShieldFootViewProps): ReactElement => {
  const elapsedMs = state.startedAtMs === undefined ? 0 : nowMs - state.startedAtMs
  const progress = Math.min(100, Math.max(0, Math.round((elapsedMs / CHECK_ETA_MS) * 100)))

  return (
    <div data-testid="safenet-shield-foot" className="border-t border-border px-4 pt-2.5 pb-3">
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
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] leading-4 text-muted-foreground">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            }
          >
            <Info className="size-3" aria-hidden />
            {SAFENET_EXPLAINER_TITLE}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-60">
            {SAFENET_EXPLAINER_COPY}
          </TooltipContent>
        </Tooltip>
        <span className="tabular-nums">{getReadyCopy(state.etaMs, nowMs)}</span>
      </div>
    </div>
  )
}

const useFlowCheck = () => {
  const { isCreation, willExecute, onlyExecute } = useContext(TxFlowContext)
  const { scenario } = useSafenetScenario()
  return useSafenetCheckState(resolveRole(scenario.role, { isCreation, willExecute, onlyExecute }))
}

export const SafenetShieldFoot = (): ReactElement | null => {
  const check = useFlowCheck()
  if (!check || !isRunningPhase(check.state.phase)) return null
  return <SafenetShieldFootView state={check.state} nowMs={check.nowMs} />
}

/** `~43s` at the right of the Shield header while a check runs. */
export const SafenetHeaderEta = (): ReactElement | null => {
  const check = useFlowCheck()
  if (!check || check.state.phase !== 'checking') return null
  const secondsLeft = getSecondsLeft(check.state.etaMs, check.nowMs)
  return secondsLeft > 0 ? <span className="tabular-nums">~{secondsLeft}s</span> : null
}

export default SafenetShieldFoot
