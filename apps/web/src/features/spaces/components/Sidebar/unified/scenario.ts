import { useCallback, useSyncExternalStore } from 'react'

export type PlanState = 'free' | 'trial' | 'trial-3' | 'trial-last' | 'paid' | 'trial-ended'
export type SafeCount = 1 | 3 | 12
export type Role = 'admin' | 'member'
export type Viewport = 'desktop' | 'mobile'
export type Context = 'accounts' | 'workspace'

export type Scenario = {
  plan: PlanState
  safes: SafeCount
  role: Role
  viewport: Viewport
  /** Which side of the workspace switcher is open. */
  context: Context
}

/** Starts in My accounts with Acme on a paid plan, so the demo can switch straight to a Pro workspace. */
export const DEFAULT_SCENARIO: Scenario = {
  plan: 'paid',
  safes: 3,
  role: 'admin',
  viewport: 'desktop',
  context: 'accounts',
}

export const PLAN_OPTIONS: { value: PlanState; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'trial', label: 'Trial, 8 days' },
  { value: 'trial-3', label: 'Trial, 3 days' },
  { value: 'trial-last', label: 'Trial, last day' },
  { value: 'paid', label: 'Pro paid' },
  { value: 'trial-ended', label: 'Trial ended' },
]

/** The switch and the scenario live in localStorage, so the mobile frame (same origin) follows the outer bar. */
const SWITCH_KEY = 'unifiedSidebarPrototype'
const SCENARIO_KEY = 'unifiedSidebarPrototype.scenario'
const CHANGE_EVENT = 'unified-sidebar-prototype-change'

/** `?proto=sidebar` turns the prototype on, `?proto=off` turns it off. */
export const SWITCH_QUERY = 'proto'

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null) => {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Private windows can block storage: the prototype then lasts only for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

const isEnabledBuild = (): boolean => process.env.NEXT_PUBLIC_IS_PRODUCTION !== 'true'

/** Reads `?proto=` once per page load and stores it, so the switch survives navigation without the query. */
export const syncSwitchFromUrl = (search: string) => {
  if (!isEnabledBuild()) return
  const value = new URLSearchParams(search).get(SWITCH_QUERY)
  if (value === 'sidebar' && read(SWITCH_KEY) !== 'on') write(SWITCH_KEY, 'on')
  if (value === 'off' && read(SWITCH_KEY) !== null) write(SWITCH_KEY, null)
}

export const turnPrototypeOff = () => write(SWITCH_KEY, null)

export const useIsPrototypeOn = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => isEnabledBuild() && read(SWITCH_KEY) === 'on',
    () => false,
  )

const parseScenario = (raw: string | null): Scenario => {
  if (!raw) return DEFAULT_SCENARIO
  try {
    return { ...DEFAULT_SCENARIO, ...(JSON.parse(raw) as Partial<Scenario>) }
  } catch {
    return DEFAULT_SCENARIO
  }
}

// useSyncExternalStore needs a stable snapshot, so the parsed scenario is cached by its raw string.
let cachedRaw: string | null | undefined
let cachedScenario: Scenario = DEFAULT_SCENARIO
const getScenarioSnapshot = (): Scenario => {
  const raw = read(SCENARIO_KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedScenario = parseScenario(raw)
  }
  return cachedScenario
}

export const useScenario = (): [Scenario, (patch: Partial<Scenario>) => void] => {
  const scenario = useSyncExternalStore(subscribe, getScenarioSnapshot, () => DEFAULT_SCENARIO)
  const update = useCallback(
    (patch: Partial<Scenario>) => write(SCENARIO_KEY, JSON.stringify({ ...getScenarioSnapshot(), ...patch })),
    [],
  )
  return [scenario, update]
}
