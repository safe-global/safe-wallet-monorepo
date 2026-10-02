import { useEffect, useState } from 'react'
import { useIsSafenetPrototypeEnabled } from '../useIsSafenetPrototypeEnabled'
import { useCheckStartedAt } from './checkStarts'
import { isRunningPhase } from './copy'
import { resolveCheckState } from './resolveCheckState'
import type { SafenetCheckState, SafenetScenario, SafenetSignerRole } from './types'
import { useSafenetScenario } from './useSafenetScenario'

export type SafenetFlowRoleInput = {
  isCreation: boolean
  willExecute: boolean
  onlyExecute: boolean
  /** This signature brings the tx to its threshold. */
  completesThreshold: boolean
}

/** Who the viewer is in the current tx flow, unless the scenario forces a role. Only the copy depends on it. */
export const resolveRole = (scenarioRole: SafenetScenario['role'], flow: SafenetFlowRoleInput): SafenetSignerRole => {
  if (scenarioRole !== 'auto') return scenarioRole
  if (flow.willExecute || flow.onlyExecute) return 'executor'
  if (flow.completesThreshold) return 'final-signer'
  return flow.isCreation ? 'first-signer' : 'co-signer'
}

const TICK_MS = 1_000

/**
 * MOCK source for every Safenet prototype surface. A check exists only once the tx has its first
 * signature, so no `safeTxHash` means `before-sign`. A tx signed in another browser counts as
 * checked long ago, unless the dev scenario was restarted since. `null` when the prototype is off
 * or the chain has no Safenet. Swap for `useSafenetCheck` + `fromPublicStatus` to wire up real data.
 */
export const useSafenetCheckState = (
  safeTxHash: string | undefined,
  options: { isExecuted?: boolean } = {},
): { state: SafenetCheckState; nowMs: number } | null => {
  const isEnabled = useIsSafenetPrototypeEnabled()
  const { scenario } = useSafenetScenario()
  const recordedStartMs = useCheckStartedAt(safeTxHash)
  const [nowMs, setNowMs] = useState(Date.now)

  const startedAtMs = safeTxHash ? (recordedStartMs ?? scenario.startedAtMs ?? 0) : undefined
  const state = resolveCheckState(scenario, startedAtMs, nowMs, options)
  const isRunning = isEnabled && isRunningPhase(state.phase)

  useEffect(() => {
    if (!isRunning) return
    setNowMs(Date.now())
    const id = setInterval(() => setNowMs(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [isRunning, startedAtMs])

  if (!isEnabled) return null
  return { state, nowMs }
}
