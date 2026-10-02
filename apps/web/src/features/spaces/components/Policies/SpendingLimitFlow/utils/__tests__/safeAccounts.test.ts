import { buildSafeAccountId, groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import { isSafeAccountGroup, type SafeAccountOption } from '../../../SafeAccountSelector/types'
import { filterSafeAccountsByChains, markSafeAccountsOffChains } from '../safeAccounts'
import type { ChainInfo } from '@/features/spaces/types'

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SAFE_B = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'

// Named so `groupSafeAccounts`'s chain-name sort has something to sort by — without it every option
// falls back to its raw chainId string, which does not sort the way these tests expect.
const CHAINS: Record<string, ChainInfo> = {
  '1': { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  '137': { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
  '11155111': { chainId: '11155111', chainName: 'Sepolia', chainLogoUri: null, shortName: 'sep' },
}

const option = (chainId: string, address: string): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, address),
  chainId,
  address,
  eligibility: 'signer',
  threshold: 2,
  owners: 3,
  chain: CHAINS[chainId],
})

describe('filterSafeAccountsByChains', () => {
  it('drops per-chain entries on unsupported chains and re-groups what is left', () => {
    const entries = groupSafeAccounts([
      option('1', SAFE_A),
      option('137', SAFE_A),
      option('11155111', SAFE_A),
      option('1', SAFE_B),
    ])

    const result = filterSafeAccountsByChains(entries, new Set(['137', '11155111']))

    expect(result).toHaveLength(1)
    const [group] = result
    expect(isSafeAccountGroup(group) && group.accounts.map((account) => account.chainId)).toEqual(['137', '11155111'])
  })

  it('flattens a group that keeps a single chain into a plain row', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A), option('137', SAFE_A)])

    const [row] = filterSafeAccountsByChains(entries, new Set(['137']))

    expect(isSafeAccountGroup(row)).toBe(false)
    expect(row).toMatchObject({ chainId: '137', address: SAFE_A })
  })

  it('returns an empty list when no chain is supported', () => {
    expect(filterSafeAccountsByChains([option('1', SAFE_A)], new Set())).toEqual([])
  })
})

describe('markSafeAccountsOffChains', () => {
  it('marks entries off the supported chains and leaves the others untouched', () => {
    const entries = [option('1', SAFE_A), option('137', SAFE_B)]

    const result = markSafeAccountsOffChains(entries, new Set(['1']))

    expect(result).toEqual([option('1', SAFE_A), { ...option('137', SAFE_B), ineligibleReason: 'unsupported-chain' }])
  })

  it('keeps a multichain group together with only its unsupported chains marked', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A), option('137', SAFE_A)])

    const [group] = markSafeAccountsOffChains(entries, new Set(['1']))

    expect(isSafeAccountGroup(group) && group.accounts.map((account) => account.ineligibleReason)).toEqual([
      undefined,
      'unsupported-chain',
    ])
  })

  it('lets the network reason win over a not-activated one', () => {
    const notActivated = { ...option('137', SAFE_A), ineligibleReason: 'not-activated' as const }

    const [row] = markSafeAccountsOffChains([notActivated], new Set(['1']))

    expect(row).toMatchObject({ ineligibleReason: 'unsupported-chain' })
  })

  it('marks everything when no chain is supported', () => {
    const result = markSafeAccountsOffChains([option('1', SAFE_A), option('137', SAFE_B)], new Set())

    expect(result.every((entry) => !isSafeAccountGroup(entry) && entry.ineligibleReason === 'unsupported-chain')).toBe(
      true,
    )
  })
})
