import { useCallback, useMemo } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import type { SafenetScenario } from './types'

const STORAGE_KEY = 'safenetPrototypeScenario'

export const DEFAULT_SCENARIO: SafenetScenario = {
  role: 'auto',
  outcome: 'no-issues',
  timing: 'about-60s',
  enhancedExecution: true,
}

// One shared start per page load, so moving between surfaces never restarts the wait.
const SESSION_STARTED_AT_MS = Date.now()

export type SafenetScenarioControls = {
  scenario: SafenetScenario
  startedAtMs: number
  /** Applies the change and restarts the check, as if the first signature was just submitted. */
  updateScenario: (change: Partial<SafenetScenario>) => void
  restartCheck: () => void
}

/** The dev scenario every Safenet prototype surface reads. Persisted, and synced across tabs. */
export const useSafenetScenario = (): SafenetScenarioControls => {
  const [stored, setStored] = useLocalStorage<SafenetScenario>(STORAGE_KEY)
  const scenario = useMemo(() => ({ ...DEFAULT_SCENARIO, ...stored }), [stored])

  const updateScenario = useCallback(
    (change: Partial<SafenetScenario>) => {
      setStored((prev) => ({ ...DEFAULT_SCENARIO, ...prev, ...change, startedAtMs: Date.now() }))
    },
    [setStored],
  )

  const restartCheck = useCallback(() => updateScenario({}), [updateScenario])

  return {
    scenario,
    startedAtMs: scenario.startedAtMs ?? SESSION_STARTED_AT_MS,
    updateScenario,
    restartCheck,
  }
}
