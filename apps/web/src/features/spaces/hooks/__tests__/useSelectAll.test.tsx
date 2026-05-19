import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import type { AllSafeItems, MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../../components/SelectSafesOnboarding/constants'

jest.mock('../../components/Sidebar/constants', () => ({
  SAFE_ACCOUNTS_LIMIT: 3,
}))

import type { AddAccountsFormValues } from '../useSelectAll.types'
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

const renderUseSelectAll = (
  visibleTrusted: AllSafeItems,
  visibleOwned: AllSafeItems,
  initialSelected: Record<string, boolean> = {},
) => {
  const getSelectedRef: { current?: () => Record<string, boolean | undefined> } = {}

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const methods = useForm<AddAccountsFormValues>({
      defaultValues: { selectedSafes: initialSelected },
    })
    getSelectedRef.current = () => methods.getValues('selectedSafes')
    return <FormProvider {...methods}>{children}</FormProvider>
  }

  const rendered = renderHook(
    () => {
      const { control, setValue } = useFormContext<AddAccountsFormValues>()
      return useSelectAll({ visibleTrusted, visibleOwned, control, setValue })
    },
    { wrapper: Wrapper },
  )

  return {
    ...rendered,
    getSelectedSafes: () => getSelectedRef.current?.() ?? {},
  }
}

describe('useSelectAll', () => {
  it('reports per-section tri-state independently', () => {
    const trusted = [makeSafe('1', '0xA')]
    const owned = [makeSafe('10', '0xB')]

    const { result } = renderUseSelectAll(trusted, owned, { '1:0xA': true })

    expect(result.current.trustedSelection).toEqual({ state: 'all', selectedCount: 1, total: 1 })
    expect(result.current.ownedSelection).toEqual({ state: 'none', selectedCount: 0, total: 1 })
  })

  it('selects every visible safe when scope=all and check=true', () => {
    const trusted = [makeSafe('1', '0xA')]
    const owned = [makeSafe('10', '0xB')]

    const { result, getSelectedSafes } = renderUseSelectAll(trusted, owned, {})

    act(() => result.current.handleSelectAll('all', true))

    const state = getSelectedSafes()
    expect(state['1:0xA']).toBe(true)
    expect(state['10:0xB']).toBe(true)
    expect(result.current.isAtLimit).toBe(false)
  })

  it('checks the multi-chain parent key only when every sub-safe is selected', () => {
    const trusted = [makeMulti('0xC', ['1', '137'])]

    const { result, getSelectedSafes } = renderUseSelectAll(trusted, [], {})

    act(() => result.current.handleSelectAll('trusted', true))

    const state = getSelectedSafes()
    const parentKey = `${MULTICHAIN_SAFE_KEY_PREFIX}0xC`
    expect(state['1:0xC']).toBe(true)
    expect(state['137:0xC']).toBe(true)
    expect(state[parentKey]).toBe(true)
  })

  it('respects the SAFE_ACCOUNTS_LIMIT cap and flags isAtLimit', () => {
    const trusted = [makeSafe('1', '0xA'), makeSafe('1', '0xB'), makeSafe('1', '0xC'), makeSafe('1', '0xD')]

    const { result, getSelectedSafes } = renderUseSelectAll(trusted, [], {})

    act(() => result.current.handleSelectAll('all', true))

    const state = getSelectedSafes()
    const selectedCount = Object.entries(state).filter(
      ([k, v]) => v && !k.startsWith(MULTICHAIN_SAFE_KEY_PREFIX),
    ).length
    expect(selectedCount).toBe(3) // SAFE_ACCOUNTS_LIMIT mocked to 3
    expect(result.current.isAtLimit).toBe(true)
  })

  it('keeps the multi-chain parent unchecked when capping leaves only some sub-safes selected', () => {
    const trusted = [makeMulti('0xC', ['1', '137', '10'])]
    const owned = [makeSafe('1', '0xZ')]

    const { result, getSelectedSafes } = renderUseSelectAll(trusted, owned, { '1:0xZ': true })

    act(() => result.current.handleSelectAll('trusted', true))

    const state = getSelectedSafes()
    const parentKey = `${MULTICHAIN_SAFE_KEY_PREFIX}0xC`
    const subCount = ['1:0xC', '137:0xC', '10:0xC'].filter((id) => state[id]).length
    expect(subCount).toBe(2)
    expect(state[parentKey]).toBe(false)
    expect(result.current.isAtLimit).toBe(true)
  })

  it('deselects every visible safe (and parents) when check=false', () => {
    const trusted = [makeMulti('0xC', ['1', '137'])]
    const owned = [makeSafe('1', '0xZ')]
    const initial = {
      '1:0xC': true,
      '137:0xC': true,
      '1:0xZ': true,
      [`${MULTICHAIN_SAFE_KEY_PREFIX}0xC`]: true,
    }

    const { result, getSelectedSafes } = renderUseSelectAll(trusted, owned, initial)

    act(() => result.current.handleSelectAll('all', false))

    const state = getSelectedSafes()
    expect(state['1:0xC']).toBe(false)
    expect(state['137:0xC']).toBe(false)
    expect(state['1:0xZ']).toBe(false)
    expect(state[`${MULTICHAIN_SAFE_KEY_PREFIX}0xC`]).toBe(false)
  })

  it('only touches the scope it was asked to act on (per-section)', () => {
    const trusted = [makeSafe('1', '0xA')]
    const owned = [makeSafe('10', '0xB')]

    const { result, getSelectedSafes } = renderUseSelectAll(trusted, owned, { '10:0xB': true })

    act(() => result.current.handleSelectAll('trusted', true))

    const state = getSelectedSafes()
    expect(state['1:0xA']).toBe(true)
    expect(state['10:0xB']).toBe(true)
  })
})
