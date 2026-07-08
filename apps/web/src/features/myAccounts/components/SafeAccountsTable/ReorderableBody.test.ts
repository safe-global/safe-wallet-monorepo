import { reorderAddresses } from './ReorderableBody'
import type { AccountGroup, AccountLine } from './useSafeAccountRows'

const group = (address: string): AccountGroup => ({
  parent: { address } as AccountLine,
  children: [],
  sort: { name: address, threshold: null, networks: 1, workspaces: 0 },
})

const groups = [group('0xA'), group('0xB'), group('0xC')]

describe('reorderAddresses', () => {
  it('moves an item down and returns the new address order', () => {
    expect(reorderAddresses(groups, 0, 2)).toEqual(['0xB', '0xC', '0xA'])
  })

  it('moves an item up and returns the new address order', () => {
    expect(reorderAddresses(groups, 2, 0)).toEqual(['0xC', '0xA', '0xB'])
  })

  it('leaves the order unchanged when source and destination match', () => {
    expect(reorderAddresses(groups, 1, 1)).toEqual(['0xA', '0xB', '0xC'])
  })
})
