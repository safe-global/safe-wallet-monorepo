import { selectAnchorAddresses, selectAnchorIndex } from '../anchorIndex'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { RootState } from '@/store'

const CONTACT = '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const ADDED = '0xbb11223344556677889900aabbccddeeff001122'
const NESTED = '0xcc11223344556677889900aabbccddeeff001133'
const UNDEPLOYED = '0xdd11223344556677889900aabbccddeeff001144'

const makeState = (parts: Partial<Record<string, unknown>> = {}): RootState =>
  ({
    addressBook: {},
    addedSafes: {},
    settings: { curatedNestedSafes: {} },
    undeployedSafes: {},
    ...parts,
  }) as unknown as RootState

const fullState = (): RootState =>
  makeState({
    addressBook: { '1': { [CONTACT]: 'Alice' } },
    addedSafes: { '1': { [ADDED]: { owners: [], threshold: 1 } } },
    settings: {
      curatedNestedSafes: {
        '0xparent': { selectedAddresses: [NESTED], hasCompletedCuration: true, lastModified: 1 },
      },
    },
    undeployedSafes: { '1': { [UNDEPLOYED]: { status: {}, props: {} } } },
  })

describe('selectAnchorAddresses', () => {
  it('collects anchors from address book + added safes + curated nested + undeployed (lowercased, deduped)', () => {
    const anchors = selectAnchorAddresses(fullState())
    expect(anchors).toEqual(
      expect.arrayContaining([
        CONTACT.toLowerCase(),
        ADDED.toLowerCase(),
        NESTED.toLowerCase(),
        UNDEPLOYED.toLowerCase(),
      ]),
    )
    expect(anchors).toHaveLength(4)
  })

  it('returns an empty array when no source has any address', () => {
    expect(selectAnchorAddresses(makeState())).toEqual([])
  })
})

describe('selectAnchorIndex', () => {
  it('treats every collected anchor as an anchor', () => {
    const index = selectAnchorIndex(fullState())
    expect(index.isAnchor(CONTACT)).toBe(true)
    expect(index.isAnchor(ADDED)).toBe(true)
    expect(index.isAnchor(NESTED)).toBe(true)
    expect(index.isAnchor(UNDEPLOYED)).toBe(true)
    expect(index.isAnchor('0x7f3e9a01bc4d2e8f00112233445566778899aabb')).toBe(false)
  })

  it('flags a both-ends lookalike of an anchor as CRITICAL', () => {
    const index = selectAnchorIndex(fullState())
    const lookalike = '0xa1b2ffffffffffffffffffffffffffffffff5678' // mimics CONTACT 4+4
    const match = index.query(lookalike)
    expect(match?.severity).toBe(Severity.CRITICAL)
    expect(match?.anchor).toBe(CONTACT.toLowerCase().slice(2))
  })

  it('does not flag an unrelated address', () => {
    expect(selectAnchorIndex(fullState()).query('0x7f3e9a01bc4d2e8f00112233445566778899aabb')).toBeNull()
  })

  it('is memoized: the same state yields the same index instance (no rebuild)', () => {
    const state = fullState()
    expect(selectAnchorIndex(state)).toBe(selectAnchorIndex(state))
  })
})
