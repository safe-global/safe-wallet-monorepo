import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sumOverviewsForAddress } from '../MockupAccountRow'

const makeOverview = (address: string, fiatTotal: string, chainId = '1'): SafeOverview => ({
  address: { value: address },
  chainId,
  threshold: 1,
  owners: [],
  fiatTotal,
  queued: 0,
})

describe('sumOverviewsForAddress', () => {
  const TARGET = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'

  it('returns null when overviews is undefined', () => {
    expect(sumOverviewsForAddress(undefined, TARGET)).toBeNull()
  })

  it('returns null when the address has no matching overview', () => {
    const overviews = [makeOverview('0xb111111111111111111111111111111111111111', '100')]
    expect(sumOverviewsForAddress(overviews, TARGET)).toBeNull()
  })

  it('returns 0 (not null) when an entry exists with fiatTotal "0"', () => {
    const overviews = [makeOverview(TARGET, '0')]
    expect(sumOverviewsForAddress(overviews, TARGET)).toBe(0)
  })

  it('sums fiatTotal across all matching entries (multi-chain Safe)', () => {
    const overviews = [
      makeOverview(TARGET, '120.5', '1'),
      makeOverview(TARGET, '50.25', '137'),
      makeOverview('0xbbbb000000000000000000000000000000000000', '999', '1'),
    ]
    expect(sumOverviewsForAddress(overviews, TARGET)).toBeCloseTo(170.75)
  })

  it('matches addresses case-insensitively', () => {
    const overviews = [makeOverview(TARGET.toLowerCase(), '42')]
    expect(sumOverviewsForAddress(overviews, TARGET)).toBe(42)
  })

  it('returns NaN when any matching entry has a non-numeric fiatTotal (fail-loud, matches real Dashboard)', () => {
    const overviews = [makeOverview(TARGET, 'NaN'), makeOverview(TARGET, '10')]
    expect(sumOverviewsForAddress(overviews, TARGET)).toBeNaN()
  })
})
