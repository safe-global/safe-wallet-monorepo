import type { UseFormSetValue } from 'react-hook-form'
import type { AllSafeItems } from '@/hooks/safes'
import type { AccountLine } from '@/features/myAccounts'
import type { AddAccountsFormValues } from '../../../hooks/addAccounts.types'
import { applySafeSelectionToggle, getSelectedLeafKeys } from './selection'

// Minimal shapes — the helpers only read key/variant/source and the items' address/safes.
const singleLine = (chainId: string, address: string) =>
  ({ key: `${chainId}:${address}`, variant: 'single', address, source: { chainId, address } }) as unknown as AccountLine

const groupLine = (address: string, chainIds: string[]) =>
  ({
    key: address,
    variant: 'group',
    address,
    source: { address, safes: chainIds.map((chainId) => ({ chainId, address })) },
  }) as unknown as AccountLine

const multiChainItem = (address: string, chainIds: string[]) =>
  ({ address, safes: chainIds.map((chainId) => ({ chainId, address })) }) as unknown as AllSafeItems[number]

describe('getSelectedLeafKeys', () => {
  it('keeps checked leaf keys and drops multi-chain parent + unchecked keys', () => {
    const keys = getSelectedLeafKeys({
      '1:0xA': true,
      '137:0xA': true,
      '1:0xB': false,
      multichain_0xA: true,
    })

    expect(keys).toEqual(new Set(['1:0xA', '137:0xA']))
  })

  it('returns an empty set when nothing is selected', () => {
    expect(getSelectedLeafKeys({}).size).toBe(0)
  })
})

describe('applySafeSelectionToggle', () => {
  const makeSetValue = () => jest.fn() as unknown as UseFormSetValue<AddAccountsFormValues>

  it('cascades a group toggle to the parent key and every child', () => {
    const setValue = makeSetValue()

    applySafeSelectionToggle(setValue, [], {}, groupLine('0xA', ['1', '137']), true)

    expect(setValue).toHaveBeenCalledWith('selectedSafes.multichain_0xA', true, { shouldValidate: true })
    expect(setValue).toHaveBeenCalledWith('selectedSafes.1:0xA', true, { shouldValidate: true })
    expect(setValue).toHaveBeenCalledWith('selectedSafes.137:0xA', true, { shouldValidate: true })
  })

  it('marks the parent checked when the last unchecked child is toggled on', () => {
    const setValue = makeSetValue()
    const items: AllSafeItems = [multiChainItem('0xA', ['1', '137'])]

    // '137:0xA' already selected; toggling '1:0xA' completes the group.
    applySafeSelectionToggle(setValue, items, { '137:0xA': true }, singleLine('1', '0xA'), true)

    expect(setValue).toHaveBeenCalledWith('selectedSafes.1:0xA', true, { shouldValidate: true })
    expect(setValue).toHaveBeenCalledWith('selectedSafes.multichain_0xA', true, { shouldValidate: true })
  })

  it('marks the parent unchecked when a child is toggled off', () => {
    const setValue = makeSetValue()
    const items: AllSafeItems = [multiChainItem('0xA', ['1', '137'])]

    applySafeSelectionToggle(setValue, items, { '1:0xA': true, '137:0xA': true }, singleLine('1', '0xA'), false)

    expect(setValue).toHaveBeenCalledWith('selectedSafes.1:0xA', false, { shouldValidate: true })
    expect(setValue).toHaveBeenCalledWith('selectedSafes.multichain_0xA', false, { shouldValidate: true })
  })

  it('does not touch a parent key for a standalone single safe', () => {
    const setValue = makeSetValue()

    applySafeSelectionToggle(setValue, [], {}, singleLine('1', '0xStandalone'), true)

    expect(setValue).toHaveBeenCalledTimes(1)
    expect(setValue).toHaveBeenCalledWith('selectedSafes.1:0xStandalone', true, { shouldValidate: true })
  })
})
