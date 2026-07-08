import { renderHook, act } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import type { AllSafeItems } from '@/hooks/safes'
import type { AddAccountsFormValues } from '../../../../hooks/addAccounts.types'
import useOnboardingSelection from '../useOnboardingSelection'

jest.mock('@/features/spaces/constants', () => ({
  ...jest.requireActual('@/features/spaces/constants'),
  SAFE_ACCOUNTS_LIMIT: 3,
}))

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

const setup = (opts: { items?: AllSafeItems; flagged?: Set<string> } = {}) =>
  renderHook(() => {
    const { control, setValue } = useForm<AddAccountsFormValues>({ defaultValues: { selectedSafes: {} } })
    return useOnboardingSelection({
      items: opts.items ?? [],
      control,
      setValue,
      flaggedOwnedAddresses: opts.flagged ?? new Set<string>(),
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

  it('defers selecting a flagged owned safe until confirmed', () => {
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
})
