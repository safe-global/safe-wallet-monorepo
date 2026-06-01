import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import { collectSafeKeys, collectParentKeys, getSelectionState } from '../selectAllHelpers'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../../components/SelectSafesOnboarding/constants'

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

describe('selectAllHelpers', () => {
  describe('collectSafeKeys', () => {
    it('returns one key per single-chain safe', () => {
      const keys = collectSafeKeys([makeSafe('1', '0xA'), makeSafe('10', '0xB')])
      expect(keys).toEqual([{ id: '1:0xA' }, { id: '10:0xB' }])
    })

    it('expands multi-chain safes into sub-safe keys with parentId', () => {
      const keys = collectSafeKeys([makeMulti('0xC', ['1', '137'])])
      expect(keys).toEqual([
        { id: '1:0xC', parentId: `${MULTICHAIN_SAFE_KEY_PREFIX}0xC` },
        { id: '137:0xC', parentId: `${MULTICHAIN_SAFE_KEY_PREFIX}0xC` },
      ])
    })

    it('handles a mix of single and multi-chain safes', () => {
      const keys = collectSafeKeys([makeSafe('1', '0xA'), makeMulti('0xC', ['1', '137'])])
      expect(keys.map((k) => k.id)).toEqual(['1:0xA', '1:0xC', '137:0xC'])
    })

    it('returns an empty list for no items', () => {
      expect(collectSafeKeys([])).toEqual([])
    })
  })

  describe('collectParentKeys', () => {
    it('returns prefixed keys only for multi-chain safes', () => {
      const parents = collectParentKeys([makeSafe('1', '0xA'), makeMulti('0xC', ['1', '137']), makeMulti('0xD', ['1'])])
      expect(parents).toEqual([`${MULTICHAIN_SAFE_KEY_PREFIX}0xC`, `${MULTICHAIN_SAFE_KEY_PREFIX}0xD`])
    })

    it('returns an empty list when there are no multi-chain safes', () => {
      expect(collectParentKeys([makeSafe('1', '0xA')])).toEqual([])
    })
  })

  describe('getSelectionState', () => {
    const items = [makeSafe('1', '0xA'), makeMulti('0xC', ['1', '137'])]

    it('returns none when nothing is selected', () => {
      expect(getSelectionState(items, {})).toEqual({ state: 'none', selectedCount: 0, total: 3 })
    })

    it('returns all when every sub-safe is selected', () => {
      const selected = { '1:0xA': true, '1:0xC': true, '137:0xC': true }
      expect(getSelectionState(items, selected)).toEqual({ state: 'all', selectedCount: 3, total: 3 })
    })

    it('returns some when only part of the set is selected', () => {
      const selected = { '1:0xA': true }
      expect(getSelectionState(items, selected)).toEqual({ state: 'some', selectedCount: 1, total: 3 })
    })

    it('returns none/total=0 for an empty list', () => {
      expect(getSelectionState([], {})).toEqual({ state: 'none', selectedCount: 0, total: 0 })
    })

    it('ignores parent multi-chain keys when counting', () => {
      const selected = { [`${MULTICHAIN_SAFE_KEY_PREFIX}0xC`]: true }
      expect(getSelectionState(items, selected)).toEqual({ state: 'none', selectedCount: 0, total: 3 })
    })
  })
})
