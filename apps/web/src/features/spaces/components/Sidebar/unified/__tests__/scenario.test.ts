import { act, renderHook } from '@testing-library/react'
import {
  DEFAULT_SCENARIO,
  SCENARIO_KEY,
  syncSwitchFromUrl,
  turnPrototypeOff,
  useIsPrototypeOn,
  useIsShellOn,
  useScenario,
} from '../scenario'
import {
  formatSafeAddress,
  getActiveSummary,
  getMockWorkspaces,
  getPersonalSafes,
  getPlanSummary,
  getSafeName,
} from '../fixtures'
import { useUnifiedSidebarSafes } from '../useUnifiedSidebarSafes'

describe('unified sidebar prototype switch', () => {
  beforeEach(() => localStorage.clear())

  it('turns on with ?proto=sidebar and off with ?proto=off', () => {
    const { result } = renderHook(() => useIsPrototypeOn())
    expect(result.current).toBe(false)

    act(() => syncSwitchFromUrl('safe=sep:0x1&proto=sidebar'))
    expect(result.current).toBe(true)

    act(() => syncSwitchFromUrl('safe=sep:0x1'))
    expect(result.current).toBe(true)

    act(() => syncSwitchFromUrl('proto=off'))
    expect(result.current).toBe(false)
  })

  it('turns off from the state bar', () => {
    const { result } = renderHook(() => useIsPrototypeOn())
    act(() => syncSwitchFromUrl('proto=sidebar'))
    act(() => turnPrototypeOff())
    expect(result.current).toBe(false)
  })

  it('stays off in production builds', () => {
    const original = process.env.NEXT_PUBLIC_IS_PRODUCTION
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
    syncSwitchFromUrl('proto=sidebar')
    const { result } = renderHook(() => useIsPrototypeOn())
    expect(result.current).toBe(false)
    process.env.NEXT_PUBLIC_IS_PRODUCTION = original
  })
})

describe('useScenario', () => {
  beforeEach(() => localStorage.clear())

  it('starts on the default scenario and merges updates', () => {
    const { result } = renderHook(() => useScenario())
    expect(result.current[0]).toEqual(DEFAULT_SCENARIO)

    act(() => result.current[1]({ plan: 'trial-3', safes: 12 }))
    expect(result.current[0]).toEqual({ ...DEFAULT_SCENARIO, plan: 'trial-3', safes: 12 })
  })

  it('falls back to the default on unreadable storage', () => {
    localStorage.setItem(SCENARIO_KEY, '{not json')
    const { result } = renderHook(() => useScenario())
    expect(result.current[0]).toEqual(DEFAULT_SCENARIO)
  })

  it('falls back to the default on a layout that no longer exists', () => {
    localStorage.setItem(SCENARIO_KEY, JSON.stringify({ layout: 'proposed', plan: 'free' }))
    const { result } = renderHook(() => useScenario())
    expect(result.current[0]).toEqual(DEFAULT_SCENARIO)
  })

  it('falls back to the default on a plan that does not exist', () => {
    localStorage.setItem(SCENARIO_KEY, JSON.stringify({ plan: 'platinum' }))
    const { result } = renderHook(() => useScenario())
    expect(result.current[0]).toEqual(DEFAULT_SCENARIO)
  })

  it('starts in the Pro Workspace on the Safe filter layout', () => {
    expect(DEFAULT_SCENARIO).toMatchObject({ layout: 'filter', context: 'workspace', plan: 'paid' })
  })
})

describe('useIsShellOn', () => {
  beforeEach(() => localStorage.clear())

  it('is on only with the switch on and the Safe filter layout', () => {
    const { result } = renderHook(() => [useIsShellOn(), useScenario()[1]] as const)
    expect(result.current[0]).toBe(false)

    act(() => syncSwitchFromUrl('proto=sidebar'))
    expect(result.current[0]).toBe(true)

    act(() => result.current[1]({ layout: 'today' }))
    expect(result.current[0]).toBe(false)
  })
})

describe('getPlanSummary', () => {
  it.each([
    ['free', false, 'Free'],
    ['trial', true, 'Pro trial · ends Nov 6'],
    ['trial-3', true, '3 days left in trial'],
    ['trial-last', true, 'Pro trial ends today'],
    ['paid', true, 'Business · 10 Safes'],
    ['trial-ended', false, 'Free · trial ended'],
  ] as const)('%s gives hasPro=%s and "%s"', (plan, hasPro, label) => {
    expect(getPlanSummary(plan, 3)).toMatchObject({ hasPro, label })
  })

  it('sizes the paid plan to the Safe count above 10', () => {
    expect(getPlanSummary('paid', 12).label).toBe('Business · 12 Safes')
  })
})

describe('getSafeName', () => {
  it('names a scenario Safe and shortens any other', () => {
    expect(getSafeName('sep:0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415')).toBe('Treasury')
    expect(getSafeName('eth:0xfF501B324DC6d78dC9F983f140B9211c3EdB4dc7')).toBe('0xfF50…4dc7')
  })
})

describe('getActiveSummary', () => {
  it('keeps My accounts on Free whatever the Workspace plan', () => {
    expect(getActiveSummary({ ...DEFAULT_SCENARIO, plan: 'paid', context: 'accounts' })).toMatchObject({
      hasPro: false,
      label: 'Free',
    })
  })

  it('follows the Workspace plan inside the Workspace', () => {
    expect(getActiveSummary({ ...DEFAULT_SCENARIO, plan: 'trial-3', context: 'workspace' })).toMatchObject({
      hasPro: true,
      label: '3 days left in trial',
    })
  })

  it('falls back to My accounts on Free, where no Workspace exists yet', () => {
    expect(getActiveSummary({ ...DEFAULT_SCENARIO, plan: 'free', context: 'workspace' }).detail).toMatch(/no workspace/)
  })
})

describe('useUnifiedSidebarSafes', () => {
  beforeEach(() => localStorage.clear())

  it('returns nothing while the prototype is off', () => {
    const { result } = renderHook(() => useUnifiedSidebarSafes())
    expect(result.current).toBeNull()
  })

  it('follows the sidebar switcher: Workspace Safes or My accounts', () => {
    act(() => syncSwitchFromUrl('proto=sidebar'))
    const { result } = renderHook(() => [useUnifiedSidebarSafes(), useScenario()[1]] as const)

    act(() => result.current[1]({ plan: 'paid', safes: 12, context: 'workspace' }))
    expect(result.current[0]).toMatchObject({ isWorkspace: true })
    expect(result.current[0]?.safes).toHaveLength(12)
    expect(result.current[0]?.safes[0]).toMatchObject({ chainId: '11155111', name: 'Treasury' })

    act(() => result.current[1]({ context: 'accounts' }))
    expect(result.current[0]).toMatchObject({ isWorkspace: false })
    expect(result.current[0]?.safes).toHaveLength(12)
    expect(result.current[0]?.safes.slice(0, 3).map((s) => s.name)).toEqual(['Treasury', 'Savings', 'Cold storage'])
  })
})

describe('mock workspaces', () => {
  it('sizes My accounts with the Safe count, keeping Treasury in both', () => {
    expect(getPersonalSafes(1).map((s) => s.name)).toEqual(['Treasury'])
    expect(getPersonalSafes(3).map((s) => s.name)).toEqual(['Treasury', 'Savings', 'Cold storage'])
    expect(getPersonalSafes(12)).toHaveLength(12)
  })

  it('has only My accounts on Free, and the Workspace once a trial has started', () => {
    expect(getMockWorkspaces({ ...DEFAULT_SCENARIO, plan: 'free' }).map((w) => w.name)).toEqual(['My accounts'])
    expect(getMockWorkspaces({ ...DEFAULT_SCENARIO, plan: 'trial-ended' }).map((w) => w.name)).toEqual([
      'My accounts',
      'Acme',
    ])
  })
})

describe('formatSafeAddress', () => {
  it('keeps the network prefix and shortens the address unless asked for all of it', () => {
    const safe = 'sep:0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415'
    expect(formatSafeAddress(safe)).toBe('sep:0xBd69…6415')
    expect(formatSafeAddress(safe, true)).toBe(safe)
  })
})
