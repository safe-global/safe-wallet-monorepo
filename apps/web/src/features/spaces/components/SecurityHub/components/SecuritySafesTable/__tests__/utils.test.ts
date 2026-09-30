import type { ScanResult, SecurityGrade } from '@/features/security/types'
import type { SpaceSafeEntry } from '../../../types'
import { buildSafeSecurityHref, formatBalance, getAggregateNonPassingCount, getNonPassingCount } from '../utils'
import { DASH } from '../constants'
import { AppRoutes } from '@/config/routes'

const mkResult = (status: ScanResult['status'], severity: SecurityGrade = 'Low'): ScanResult => ({
  status,
  severity,
  score: status === 'clear' ? 100 : 30,
  evidence: [],
  remediation: '',
  lastChecked: '2026-06-12T00:00:00Z',
})

const scanKey = (address: string, chainId: string) => `${address.toLowerCase()}:${chainId}`

describe('getNonPassingCount', () => {
  it('returns 0 for undefined results (Safe never scanned)', () => {
    expect(getNonPassingCount(undefined)).toBe(0)
  })

  it('returns 0 when every check passes', () => {
    expect(
      getNonPassingCount({
        a: mkResult('clear'),
        b: mkResult('clear'),
      }),
    ).toBe(0)
  })

  it('counts both issue and partial as non-passing (matches panel applicableCount - passing)', () => {
    // 1 issue + 2 partial = 3 non-passing — the same number the panel header surfaces.
    expect(
      getNonPassingCount({
        a: mkResult('issue', 'High'),
        b: mkResult('partial', 'High'),
        c: mkResult('partial', 'Medium'),
        d: mkResult('clear'),
      }),
    ).toBe(3)
  })

  it('excludes not_applicable and inconclusive (mirrors computeSummary)', () => {
    expect(
      getNonPassingCount({
        a: mkResult('issue'),
        b: mkResult('not_applicable'),
        c: mkResult('inconclusive'),
      }),
    ).toBe(1)
  })
})

describe('getAggregateNonPassingCount', () => {
  const safe: SpaceSafeEntry = {
    address: '0xabc0000000000000000000000000000000000001',
    chainId: '1',
    name: 'Multi',
    isMultichain: true,
    chainEntries: [
      { chainId: '1', isDeployed: true },
      { chainId: '137', isDeployed: true },
      { chainId: '10', isDeployed: true },
    ] as SpaceSafeEntry['chainEntries'],
  }

  it('sums non-passing counts across every chain entry', () => {
    const scanResults = {
      [scanKey(safe.address, '1')]: { a: mkResult('issue'), b: mkResult('partial') }, // 2
      [scanKey(safe.address, '137')]: { a: mkResult('clear') }, //                      0
      [scanKey(safe.address, '10')]: { a: mkResult('issue'), b: mkResult('issue') }, // 2
    } as Record<string, Record<string, ScanResult>>
    expect(getAggregateNonPassingCount(safe, scanResults, scanKey)).toBe(4)
  })

  it('treats missing scan results as 0 (chain not scanned yet)', () => {
    expect(getAggregateNonPassingCount(safe, {}, scanKey)).toBe(0)
  })
})

describe('formatBalance', () => {
  describe('zero balance (WA-2354)', () => {
    it('renders $0 for the string "0" instead of a dash', () => {
      expect(formatBalance('0')).toBe('$0')
    })

    it('renders $0 for a fractional zero like "0.0"', () => {
      expect(formatBalance('0.0')).toBe('$0')
    })

    it('renders $0 for a tiny positive value that rounds down to 0', () => {
      // The intent of the ticket: known zero must read as zero, not "—".
      // Sub-dollar amounts also format to "$0" via toFixed(0).
      expect(formatBalance('0.49')).toBe('$0')
    })
  })

  describe('missing / unknown balance', () => {
    it('returns a dash for undefined (balance not loaded)', () => {
      expect(formatBalance(undefined)).toBe(DASH)
    })

    it('returns a dash for null', () => {
      expect(formatBalance(null)).toBe(DASH)
    })

    it('returns a dash for an empty string', () => {
      expect(formatBalance('')).toBe(DASH)
    })

    it('returns a dash for a non-numeric string (NaN)', () => {
      expect(formatBalance('abc')).toBe(DASH)
    })
  })

  describe('positive balances', () => {
    it('formats sub-thousand values as a whole-dollar string', () => {
      expect(formatBalance('1')).toBe('$1')
      expect(formatBalance('500')).toBe('$500')
      expect(formatBalance('999')).toBe('$999')
    })

    it('formats thousands with a K suffix and one decimal', () => {
      expect(formatBalance('1000')).toBe('$1.0K')
      expect(formatBalance('1500')).toBe('$1.5K')
      expect(formatBalance('999000')).toBe('$999.0K')
    })

    it('formats millions with an M suffix and one decimal', () => {
      expect(formatBalance('1000000')).toBe('$1.0M')
      expect(formatBalance('2500000')).toBe('$2.5M')
    })
  })
})

describe('buildSafeSecurityHref', () => {
  const chainShortNames = { '1': 'eth', '137': 'matic' }
  const address = '0x1234567890123456789012345678901234567890'

  it("links to the Safe's security settings page with a prefixed safe param", () => {
    expect(buildSafeSecurityHref(chainShortNames, address, '1')).toEqual({
      pathname: AppRoutes.settings.security,
      query: { safe: `eth:${address}` },
    })
  })

  it('uses the short name matching the given chainId', () => {
    expect(buildSafeSecurityHref(chainShortNames, address, '137')).toEqual({
      pathname: AppRoutes.settings.security,
      query: { safe: `matic:${address}` },
    })
  })

  it('returns undefined when the chain has no known short name (renders as plain text)', () => {
    expect(buildSafeSecurityHref(chainShortNames, address, '999')).toBeUndefined()
    expect(buildSafeSecurityHref({}, address, '1')).toBeUndefined()
  })
})
