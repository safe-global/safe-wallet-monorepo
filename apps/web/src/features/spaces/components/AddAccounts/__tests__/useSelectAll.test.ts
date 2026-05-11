import { renderHook, act } from '@testing-library/react'
import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../../SelectSafesOnboarding/constants'

jest.mock('../../Sidebar/constants', () => ({
  SAFE_ACCOUNTS_LIMIT: 3,
}))

import { useSelectAll } from '../useSelectAll'

const makeSafe = (chainId: string, address: string): SafeItem => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

const makeMulti = (address: string, chainIds: string[]): MultiChainSafeItem => ({
  address,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  safes: chainIds.map((c) => makeSafe(c, address)),
})

type SetValueCall = [string, boolean, unknown?]

function makeSetValue() {
  const calls: SetValueCall[] = []
  const fn = ((name: string, value: boolean, opts?: unknown) => {
    calls.push([name, value, opts])
  }) as never
  return { fn, calls }
}

function finalState(calls: SetValueCall[]): Record<string, boolean> {
  const state: Record<string, boolean> = {}
  calls.forEach(([key, val]) => {
    const id = key.replace(/^selectedSafes\./, '')
    state[id] = val
  })
  return state
}

describe('useSelectAll', () => {
  it('reports global tri-state across both sections', () => {
    const trusted = [makeSafe('1', '0xA')]
    const owned = [makeSafe('10', '0xB')]
    const { fn } = makeSetValue()

    const { result } = renderHook(() =>
      useSelectAll({
        visibleTrusted: trusted,
        visibleOwned: owned,
        selectedSafes: { '1:0xA': true },
        setValue: fn,
      }),
    )

    expect(result.current.globalSelection).toEqual({ state: 'some', selectedCount: 1, total: 2 })
    expect(result.current.trustedSelection.state).toBe('all')
    expect(result.current.ownedSelection.state).toBe('none')
  })

  it('selects every visible safe when scope=all and check=true', () => {
    const trusted = [makeSafe('1', '0xA')]
    const owned = [makeSafe('10', '0xB')]
    const { fn, calls } = makeSetValue()

    const { result } = renderHook(() =>
      useSelectAll({ visibleTrusted: trusted, visibleOwned: owned, selectedSafes: {}, setValue: fn }),
    )

    act(() => result.current.handleSelectAll('all', true))

    const state = finalState(calls)
    expect(state['1:0xA']).toBe(true)
    expect(state['10:0xB']).toBe(true)
    expect(result.current.capReached).toBe(false)
  })

  it('checks the multi-chain parent key only when every sub-safe is selected', () => {
    const trusted = [makeMulti('0xC', ['1', '137'])]
    const { fn, calls } = makeSetValue()

    const { result } = renderHook(() =>
      useSelectAll({ visibleTrusted: trusted, visibleOwned: [], selectedSafes: {}, setValue: fn }),
    )

    act(() => result.current.handleSelectAll('trusted', true))

    const state = finalState(calls)
    const parentKey = `${MULTICHAIN_SAFE_KEY_PREFIX}0xC`
    expect(state['1:0xC']).toBe(true)
    expect(state['137:0xC']).toBe(true)
    expect(state[parentKey]).toBe(true)
  })

  it('respects the SAFE_ACCOUNTS_LIMIT cap and flags capReached', () => {
    const trusted = [makeSafe('1', '0xA'), makeSafe('1', '0xB'), makeSafe('1', '0xC'), makeSafe('1', '0xD')]
    const { fn, calls } = makeSetValue()

    const { result } = renderHook(() =>
      useSelectAll({ visibleTrusted: trusted, visibleOwned: [], selectedSafes: {}, setValue: fn }),
    )

    act(() => result.current.handleSelectAll('all', true))

    const state = finalState(calls)
    const selectedCount = Object.values(state).filter(Boolean).length
    expect(selectedCount).toBe(3) // SAFE_ACCOUNTS_LIMIT mocked to 3
    expect(result.current.capReached).toBe(true)
  })

  it('keeps the multi-chain parent unchecked when capping leaves only some sub-safes selected', () => {
    const trusted = [makeMulti('0xC', ['1', '137', '10'])]
    const owned = [makeSafe('1', '0xZ')]
    const { fn, calls } = makeSetValue()

    const { result } = renderHook(() =>
      useSelectAll({
        visibleTrusted: trusted,
        visibleOwned: owned,
        selectedSafes: { '1:0xZ': true },
        setValue: fn,
      }),
    )

    act(() => result.current.handleSelectAll('trusted', true))

    const state = finalState(calls)
    const parentKey = `${MULTICHAIN_SAFE_KEY_PREFIX}0xC`
    // cap=3, already 1 selected outside (0xZ), so only 2 of 3 sub-safes fit
    const subCount = ['1:0xC', '137:0xC', '10:0xC'].filter((id) => state[id]).length
    expect(subCount).toBe(2)
    expect(state[parentKey]).toBe(false)
    expect(result.current.capReached).toBe(true)
  })

  it('deselects every visible safe (and parents) when check=false', () => {
    const trusted = [makeMulti('0xC', ['1', '137'])]
    const owned = [makeSafe('1', '0xZ')]
    const { fn, calls } = makeSetValue()
    const selected = { '1:0xC': true, '137:0xC': true, '1:0xZ': true, [`${MULTICHAIN_SAFE_KEY_PREFIX}0xC`]: true }

    const { result } = renderHook(() =>
      useSelectAll({ visibleTrusted: trusted, visibleOwned: owned, selectedSafes: selected, setValue: fn }),
    )

    act(() => result.current.handleSelectAll('all', false))

    const state = finalState(calls)
    expect(state['1:0xC']).toBe(false)
    expect(state['137:0xC']).toBe(false)
    expect(state['1:0xZ']).toBe(false)
    expect(state[`${MULTICHAIN_SAFE_KEY_PREFIX}0xC`]).toBe(false)
  })

  it('only touches the scope it was asked to act on (per-section)', () => {
    const trusted = [makeSafe('1', '0xA')]
    const owned = [makeSafe('10', '0xB')]
    const { fn, calls } = makeSetValue()

    const { result } = renderHook(() =>
      useSelectAll({
        visibleTrusted: trusted,
        visibleOwned: owned,
        selectedSafes: { '10:0xB': true },
        setValue: fn,
      }),
    )

    act(() => result.current.handleSelectAll('trusted', true))

    const touchedKeys = calls.map(([k]) => k)
    expect(touchedKeys).toContain('selectedSafes.1:0xA')
    expect(touchedKeys).not.toContain('selectedSafes.10:0xB')
  })
})
