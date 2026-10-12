import { renderHook, act } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import type { AllSafeItems } from '@/hooks/safes'
import type { AddAccountsFormValues } from '../../../../hooks/addAccounts.types'
import type { SafeLimit } from '@/utils/spaces'
import useOnboardingSelection from '../useOnboardingSelection'

// Minimal AccountLine shapes — the hook only reads key/variant/address/source.
const singleLine = (chainId: string, address: string) =>
  ({ key: `${chainId}:${address}`, variant: 'single', address, source: { chainId, address } }) as never

const groupLine = (address: string, chainIds: string[]) =>
  ({
    key: address,
    variant: 'group',
    address,
    source: { address, safes: chainIds.map((chainId) => ({ chainId, address })) },
  }) as never

const setup = (
  opts: { items?: AllSafeItems; flagged?: Set<string>; selected?: Record<string, boolean>; limit?: SafeLimit } = {},
) =>
  renderHook(() => {
    const { control, setValue } = useForm<AddAccountsFormValues>({
      defaultValues: { selectedSafes: opts.selected ?? {} },
    })
    return useOnboardingSelection({
      items: opts.items ?? [],
      control,
      setValue,
      flaggedAddresses: opts.flagged ?? new Set<string>(),
      limit: 'limit' in opts ? opts.limit : 3,
    })
  })

describe('useOnboardingSelection', () => {
  it('selects an unflagged safe immediately', () => {
    const { result } = setup()

    act(() => result.current.handleToggle(singleLine('1', '0xA'), true))

    expect(result.current.selectedKeys.has('1:0xA')).toBe(true)
    expect(result.current.pendingConfirmation).toBeNull()
  })

  it('deselects a previously selected safe', () => {
    const { result } = setup()

    act(() => result.current.handleToggle(singleLine('1', '0xA'), true))
    act(() => result.current.handleToggle(singleLine('1', '0xA'), false))

    expect(result.current.selectedKeys.has('1:0xA')).toBe(false)
  })

  it('defers selecting a flagged safe until confirmed', () => {
    const { result } = setup({ flagged: new Set(['0xflagged']) })

    act(() => result.current.handleToggle(singleLine('1', '0xFlagged'), true))

    // Not selected yet — awaiting confirmation
    expect(result.current.selectedKeys.has('1:0xFlagged')).toBe(false)
    expect(result.current.pendingConfirmation?.address).toBe('0xFlagged')

    act(() => result.current.confirmPending())

    expect(result.current.selectedKeys.has('1:0xFlagged')).toBe(true)
    expect(result.current.pendingConfirmation).toBeNull()
  })

  it('cancels a pending confirmation without selecting', () => {
    const { result } = setup({ flagged: new Set(['0xflagged']) })

    act(() => result.current.handleToggle(singleLine('1', '0xFlagged'), true))
    act(() => result.current.cancelPending())

    expect(result.current.selectedKeys.has('1:0xFlagged')).toBe(false)
    expect(result.current.pendingConfirmation).toBeNull()
  })

  it('selects all sub-safes when a multi-chain group is toggled', () => {
    const { result } = setup()

    act(() => result.current.handleToggle(groupLine('0xMulti', ['1', '137']), true))

    expect(result.current.selectedKeys.has('1:0xMulti')).toBe(true)
    expect(result.current.selectedKeys.has('137:0xMulti')).toBe(true)
  })

  it('flags reaching the per-workspace cap', () => {
    const { result } = setup()

    act(() => result.current.handleToggle(singleLine('1', '0xA'), true))
    act(() => result.current.handleToggle(singleLine('1', '0xB'), true))
    expect(result.current.isAtLimit).toBe(false)

    act(() => result.current.handleToggle(singleLine('1', '0xC'), true))
    expect(result.current.isAtLimit).toBe(true)
  })

  it('counts a Safe on several chains as one seat towards the cap', () => {
    const multiChainSafe = {
      address: '0xA',
      safes: [
        { chainId: '1', address: '0xA' },
        { chainId: '10', address: '0xA' },
      ],
    }
    const group = groupLine('0xA', ['1', '10'])
    const { result } = setup({ items: [multiChainSafe] as unknown as AllSafeItems })

    act(() => result.current.handleToggle(group, true))
    expect(result.current.selectedKeys.size).toBe(2)
    expect(result.current.seatCount).toBe(1)
    expect(result.current.isAtLimit).toBe(false)

    act(() => result.current.handleToggle(singleLine('1', '0xB'), true))
    act(() => result.current.handleToggle(singleLine('1', '0xC'), true))
    expect(result.current.seatCount).toBe(3)
    expect(result.current.isAtLimit).toBe(true)
    expect(result.current.isOverLimit).toBe(false)
  })

  it('reports a selection above the cap until the user deselects down to it', () => {
    const { result } = setup({ selected: { '1:0xA': true, '1:0xB': true, '1:0xC': true, '1:0xD': true } })

    expect(result.current.isOverLimit).toBe(true)
    expect(result.current.isAtLimit).toBe(true)

    act(() => result.current.handleToggle(singleLine('1', '0xD'), false))
    expect(result.current.isOverLimit).toBe(false)
    expect(result.current.isAtLimit).toBe(true)
  })

  it('locks further picks without flagging the cap while the limit is unknown', () => {
    const { result } = setup({ limit: undefined, selected: { '1:0xA': true } })

    expect(result.current.isSelectionLocked).toBe(true)
    expect(result.current.isAtLimit).toBe(false)
    expect(result.current.isOverLimit).toBe(false)
  })

  it('never locks an unlimited plan', () => {
    const { result } = setup({ limit: null, selected: { '1:0xA': true, '1:0xB': true, '1:0xC': true, '1:0xD': true } })

    expect(result.current.isSelectionLocked).toBe(false)
    expect(result.current.isAtLimit).toBe(false)
  })
})
