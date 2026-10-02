import { useCallback, useMemo } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { clearCheckStarts } from './checkStarts'
import type { SafenetScenario } from './types'

const STORAGE_KEY = 'safenetPrototypeScenario'

export const DEFAULT_SCENARIO: SafenetScenario = {
  role: 'auto',
  outcome: 'no-issues',
  timing: 'about-60s',
  enhancedExecution: true,
}

export type SafenetScenarioControls = {
  scenario: SafenetScenario
  /** Applies the change and restarts every check, as if each tx was just signed for the first time. */
  updateScenario: (change: Partial<SafenetScenario>) => void
  restartCheck: () => void
}

/** The dev scenario every Safenet prototype surface reads. Persisted, and synced across tabs. */
export const useSafenetScenario = (): SafenetScenarioControls => {
  const [stored, setStored] = useLocalStorage<SafenetScenario>(STORAGE_KEY)
  const scenario = useMemo(() => ({ ...DEFAULT_SCENARIO, ...stored }), [stored])

  const updateScenario = useCallback(
    (change: Partial<SafenetScenario>) => {
      clearCheckStarts()
      setStored((prev) => ({ ...DEFAULT_SCENARIO, ...prev, ...change, startedAtMs: Date.now() }))
    },
    [setStored],
  )

  const restartCheck = useCallback(() => updateScenario({}), [updateScenario])

  return { scenario, updateScenario, restartCheck }
}
