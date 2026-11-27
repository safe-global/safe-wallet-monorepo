import { act, renderHook } from '@testing-library/react'
import { getMockSafes, MOCK_SPACE_ID } from '../fixtures'
import { syncSwitchFromUrl, useScenario } from '../scenario'
import { useIsUnifiedShell } from '../useIsUnifiedShell'
import { useSafeRequest, useShell } from '../useShell'

const [TREASURY, OPS] = getMockSafes(3).map((s) => s.safe)
const OUTSIDE = 'eth:0x0000000000000000000000000000000000000001'

const mockPush = jest.fn(async () => true)
const mockRouter: { pathname: string; query: Record<string, string>; push: typeof mockPush } = {
  pathname: '/home',
  query: {},
  push: mockPush,
}
jest.mock('next/router', () => ({ useRouter: () => mockRouter }))
jest.mock('next/compat/router', () => ({ useRouter: () => mockRouter }))
// Jest's own page URL carries a Safe, which the real hook falls back to.
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({ useSafeQueryParam: () => mockRouter.query.safe ?? '' }))

const open = (pathname: string, query: Record<string, string> = {}) => Object.assign(mockRouter, { pathname, query })

describe('useShell', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
    open('/home', { safe: TREASURY })
  })

  it('reads the open workspace, the picked Safe and the page from the scenario and the URL', () => {
    const { result } = renderHook(() => useShell())

    expect(result.current).toMatchObject({ isWorkspace: true, hasPro: true, hasAllSafes: true, pageKey: 'overview' })
    expect(result.current.pickedSafe).toMatchObject({ name: 'Treasury', safe: TREASURY })
    expect(result.current.workspaces.map((w) => w.name)).toEqual(['My accounts', 'Acme'])
  })

  it('has no picked Safe on a Workspace page, which is All Safes', () => {
    open('/spaces/policies', { spaceId: MOCK_SPACE_ID })
    const { result } = renderHook(() => useShell())

    expect(result.current.pickedSafe).toBeUndefined()
    expect(result.current.pageKey).toBe('policies')
  })

  it('names a Safe from outside the scenario by its short address and invents no figures for it', () => {
    open('/home', { safe: OUTSIDE })
    const { result } = renderHook(() => useShell())

    expect(result.current.pickedSafe).toMatchObject({ name: '0x0000…0001', owners: 0 })
    expect(result.current.pickedSafe?.balance).toBeNaN()
  })

  it('keeps the page when another Safe is picked', () => {
    open('/transactions/queue', { safe: TREASURY, spaceId: MOCK_SPACE_ID })
    const { result } = renderHook(() => useShell())

    act(() => void result.current.pickSafe('workspace', OPS))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/transactions/history',
      query: { safe: OPS, spaceId: MOCK_SPACE_ID },
    })
  })

  it('opens a requested page for the picked Safe instead of the current one', () => {
    const { result } = renderHook(() => useShell())

    act(() => void result.current.pickSafe('workspace', OPS, 'swap'))

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/swap', query: { safe: OPS, spaceId: MOCK_SPACE_ID } })
  })

  it('switches to My accounts and its free account list in one pick', () => {
    const { result } = renderHook(() => [useShell(), useScenario()[0]] as const)

    act(() => void result.current[0].pickSafe('accounts', null))

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/welcome/accounts', query: {} })
    expect(result.current[1].context).toBe('accounts')
    expect(result.current[0]).toMatchObject({ isWorkspace: false, hasPro: false })
  })

  it('offers no All Safes on Free with one Safe', () => {
    const { result } = renderHook(() => [useShell(), useScenario()[1]] as const)

    act(() => result.current[1]({ plan: 'free', safes: 1 }))

    expect(result.current[0]).toMatchObject({ isWorkspace: false, hasAllSafes: false })
    expect(result.current[0].workspaces).toHaveLength(1)
  })
})

describe('useSafeRequest', () => {
  it('shares the open request between the app bar and the sidebar', () => {
    const bar = renderHook(() => useSafeRequest())
    const sidebar = renderHook(() => useSafeRequest())

    act(() => sidebar.result.current[1]({ page: 'swap', label: 'Swap' }))
    expect(bar.result.current[0]).toEqual({ page: 'swap', label: 'Swap' })

    act(() => bar.result.current[1](null))
    expect(sidebar.result.current[0]).toBeNull()
  })
})

describe('useIsUnifiedShell', () => {
  beforeEach(() => {
    localStorage.clear()
    open('/home', { safe: TREASURY })
  })

  it('is off without the switch', () => {
    const { result } = renderHook(() => useIsUnifiedShell())
    expect(result.current).toBe(false)
  })

  it('is on for a Safe page once the switch is on, and off on a page the shell leaves alone', () => {
    act(() => syncSwitchFromUrl('proto=sidebar'))
    expect(renderHook(() => useIsUnifiedShell()).result.current).toBe(true)

    open('/welcome/spaces')
    expect(renderHook(() => useIsUnifiedShell()).result.current).toBe(false)
  })

  it('is off in the Today layout, which renders production', () => {
    act(() => syncSwitchFromUrl('proto=sidebar'))
    const { result } = renderHook(() => [useIsUnifiedShell(), useScenario()[1]] as const)

    act(() => result.current[1]({ layout: 'today' }))

    expect(result.current[0]).toBe(false)
  })

  it('stays off in production builds', () => {
    const original = process.env.NEXT_PUBLIC_IS_PRODUCTION
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
    syncSwitchFromUrl('proto=sidebar')
    expect(renderHook(() => useIsUnifiedShell()).result.current).toBe(false)
    process.env.NEXT_PUBLIC_IS_PRODUCTION = original
  })
})
