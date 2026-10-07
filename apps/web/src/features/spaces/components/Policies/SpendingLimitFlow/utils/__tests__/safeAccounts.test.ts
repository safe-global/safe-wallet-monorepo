import { buildSafeAccountId, groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import { isSafeAccountGroup, type SafeAccountOption } from '../../../SafeAccountSelector/types'
import { markSafeAccountsOffChains } from '../safeAccounts'
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

describe('markSafeAccountsOffChains', () => {
  it('marks entries off the supported chains and leaves the others untouched', () => {
    const entries = [option('1', SAFE_A), option('137', SAFE_B)]

    const result = markSafeAccountsOffChains(entries, new Set(['1']), 'unsupported-chain')

    expect(result).toEqual([option('1', SAFE_A), { ...option('137', SAFE_B), ineligibleReason: 'unsupported-chain' }])
  })

  it('keeps a multichain group together with only its unsupported chains marked', () => {
    const entries = groupSafeAccounts([option('1', SAFE_A), option('137', SAFE_A)])

    const [group] = markSafeAccountsOffChains(entries, new Set(['1']), 'unsupported-chain')

    expect(isSafeAccountGroup(group) && group.accounts.map((account) => account.ineligibleReason)).toEqual([
      undefined,
      'unsupported-chain',
    ])
  })

  it('keeps a not-activated reason over the network one', () => {
    const notActivated = { ...option('137', SAFE_A), ineligibleReason: 'not-activated' as const }

    const [row] = markSafeAccountsOffChains([notActivated], new Set(['1']), 'unsupported-chain')

    expect(row).toMatchObject({ ineligibleReason: 'not-activated' })
  })

  it('marks everything when no chain is supported', () => {
    const result = markSafeAccountsOffChains(
      [option('1', SAFE_A), option('137', SAFE_B)],
      new Set(),
      'no-spending-limits',
    )

    expect(result.every((entry) => !isSafeAccountGroup(entry) && entry.ineligibleReason === 'no-spending-limits')).toBe(
      true,
    )
  })

  it('keeps the earlier reason when marked twice', () => {
    const marked = markSafeAccountsOffChains(
      [option('1', SAFE_A), option('137', SAFE_B)],
      new Set(['1']),
      'no-spending-limits',
    )

    const result = markSafeAccountsOffChains(marked, new Set(['137']), 'unsupported-chain')

    expect(result.map((entry) => !isSafeAccountGroup(entry) && entry.ineligibleReason)).toEqual([
      'unsupported-chain',
      'no-spending-limits',
    ])
  })
})
