import { buildSafeAccountId, groupSafeAccounts } from './utils'
import { isSafeAccountGroup, type SafeAccountOption } from './types'
import type { ChainInfo } from '@/features/spaces/types'

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SAFE_B = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'

const CHAINS: Record<string, ChainInfo> = {
  '1': { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  '137': { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
  '11155111': { chainId: '11155111', chainName: 'Sepolia', chainLogoUri: null, shortName: 'sep' },
}

const option = (chainId: string, address: string, extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, address),
  chainId,
  address,
  eligibility: 'signer',
  chain: CHAINS[chainId],
  ...extra,
})

describe('buildSafeAccountId', () => {
  it('builds the `chainId:address` form value', () => {
    expect(buildSafeAccountId('11155111', SAFE_A)).toBe(`11155111:${SAFE_A}`)
  })
})

describe('groupSafeAccounts', () => {
  it('groups a Safe eligible on several chains under one header', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A), option('137', SAFE_A), option('11155111', SAFE_A)])

    expect(entries).toHaveLength(1)
    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.address).toBe(SAFE_A)
    expect(group.accounts).toHaveLength(3)
  })

  it('keeps a Safe eligible on exactly one chain as a flat option', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A)])

    expect(entries).toHaveLength(1)
    expect(isSafeAccountGroup(entries[0])).toBe(false)
    expect(entries[0]).toEqual(option('1', SAFE_A))
  })

  it('sorts a group’s chain rows by chain name', () => {
    const entries = groupSafeAccounts([option('11155111', SAFE_A), option('1', SAFE_A), option('137', SAFE_A)])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.accounts.map((account) => account.chainId)).toEqual(['1', '137', '11155111'])
  })

  it('falls back to the chain id when the chain config has not loaded', () => {
    const entries = groupSafeAccounts([
      option('137', SAFE_A, { chain: undefined }),
      option('1', SAFE_A, { chain: undefined }),
    ])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.accounts.map((account) => account.chainId)).toEqual(['1', '137'])
  })

  it('preserves the input order of top-level entries by first appearance', () => {
    const entries = groupSafeAccounts([option('137', SAFE_B), option('1', SAFE_A), option('11155111', SAFE_A)])

    expect(entries.map((entry) => entry.address)).toEqual([SAFE_B, SAFE_A])
  })

  it('takes the group name from the first named chain entry', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A), option('137', SAFE_A, { name: 'Treasury' })])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.name).toBe('Treasury')
  })

  it('leaves the group name unset when no chain entry is named', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A), option('137', SAFE_A)])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.name).toBeUndefined()
  })

  it('totals the group balance across its chains', () => {
    const entries = groupSafeAccounts([
      option('1', SAFE_A, { fiatTotal: '1200.5' }),
      option('137', SAFE_A, { fiatTotal: '99.5' }),
    ])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.fiatTotal).toBe('1300')
  })

  it('counts a chain with no resolved balance as zero in the group total', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A, { fiatTotal: '100' }), option('137', SAFE_A)])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.fiatTotal).toBe('100')
  })

  it('leaves the group balance unset while no chain has resolved one', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A), option('137', SAFE_A)])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.fiatTotal).toBeUndefined()
  })

  it('lifts a shared threshold onto the group when every chain has the same setup', () => {
    const entries = groupSafeAccounts([
      option('1', SAFE_A, { threshold: 3, owners: 5 }),
      option('137', SAFE_A, { threshold: 3, owners: 5 }),
    ])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group).toMatchObject({ threshold: 3, owners: 5 })
  })

  it('leaves the group setup unset when the chains disagree, so the header cannot claim a wrong one', () => {
    const entries = groupSafeAccounts([
      option('1', SAFE_A, { threshold: 3, owners: 5 }),
      option('137', SAFE_A, { threshold: 2, owners: 5 }),
    ])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.threshold).toBeUndefined()
    expect(group.owners).toBeUndefined()
  })

  it('leaves the group setup unset while a chain has not resolved its overview', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A, { threshold: 3, owners: 5 }), option('137', SAFE_A)])

    const [group] = entries
    if (!isSafeAccountGroup(group)) throw new Error('expected a group')
    expect(group.threshold).toBeUndefined()
  })

  it('returns an empty list for no options', () => {
    expect(groupSafeAccounts([])).toEqual([])
  })
})
