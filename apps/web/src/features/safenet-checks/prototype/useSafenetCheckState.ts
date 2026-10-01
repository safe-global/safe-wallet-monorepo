import { useEffect, useState } from 'react'
import { useIsSafenetPrototypeEnabled } from '../useIsSafenetPrototypeEnabled'
import { isRunningPhase } from './copy'
import { resolveCheckState } from './resolveCheckState'
import type { SafenetCheckState, SafenetScenario, SafenetSignerRole } from './types'
import { useSafenetScenario } from './useSafenetScenario'

export type SafenetFlowRoleInput = {
  isCreation: boolean
  willExecute: boolean
  onlyExecute: boolean
}

/** The signer's role in the current tx flow, unless the scenario forces one. */
export const resolveRole = (scenarioRole: SafenetScenario['role'], flow: SafenetFlowRoleInput): SafenetSignerRole => {
  if (scenarioRole !== 'auto') return scenarioRole
  if (flow.isCreation) return flow.willExecute ? 'single-owner' : 'first-signer'
  if (flow.willExecute || flow.onlyExecute) return 'executor'
  return 'co-signer'
}

const TICK_MS = 1_000

/**
 * MOCK source for every Safenet prototype surface: the check state for the viewer's role, from
 * the dev scenario instead of the chain. `null` when the prototype is off or the chain is not
 * Ethereum or Gnosis Chain. Swap the scenario read for `useSafenetCheck` + `fromPublicStatus`
 * to wire up real data.
 */
export const useSafenetCheckState = (
  role: SafenetSignerRole,
  options: { isExecuted?: boolean } = {},
): { state: SafenetCheckState; nowMs: number } | null => {
  const isEnabled = useIsSafenetPrototypeEnabled()
  const { scenario, startedAtMs } = useSafenetScenario()
  const [nowMs, setNowMs] = useState(Date.now)

  const state = resolveCheckState(scenario, role, startedAtMs, nowMs, options)
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
