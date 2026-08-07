import { isSafeAffectedByZodiacVulnerability } from '../vulnerableModules'

const mockLogError = jest.fn()
jest.mock('@/services/exceptions', () => ({
  Errors: { _621: '621: Error checking modules for known vulnerabilities' },
  logError: (...args: unknown[]) => mockLogError(...args),
}))

const CHAIN = '1'
const SAFE = '0x1F334f5947ca5170C3E31c044E718369B62E5CB5'

const mockFetch = (response: unknown, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => response,
  }) as unknown as typeof fetch
}

beforeEach(() => {
  mockLogError.mockClear()
})

describe('isSafeAffectedByZodiacVulnerability', () => {
  it('returns true when the Safe is the affected avatar', async () => {
    mockFetch({
      status: 'affected',
      checkedVaultCount: 1,
      erroredVaultCount: 0,
      affectedSafes: [{ chainId: 1, address: SAFE.toLowerCase(), fallbackHandler: '0xabc', via: [] }],
    })

    expect(await isSafeAffectedByZodiacVulnerability(CHAIN, SAFE)).toBe(true)
  })

  it('returns true when the Safe is a member/vector (appears only in `via`)', async () => {
    mockFetch({
      status: 'affected',
      checkedVaultCount: 1,
      erroredVaultCount: 0,
      affectedSafes: [
        {
          chainId: 1,
          address: '0x9999999999999999999999999999999999999999',
          fallbackHandler: '0xabc',
          via: [{ chainId: 1, address: SAFE.toLowerCase(), label: null }],
        },
      ],
    })

    expect(await isSafeAffectedByZodiacVulnerability(CHAIN, SAFE)).toBe(true)
  })

  it('returns false when the API reports the Safe as safe', async () => {
    mockFetch({ status: 'safe', checkedVaultCount: 1, erroredVaultCount: 0, affectedSafes: [] })
    expect(await isSafeAffectedByZodiacVulnerability(CHAIN, SAFE)).toBe(false)
  })

  it('queries the right URL with an encoded chainId:address pair', async () => {
    mockFetch({ status: 'safe', checkedVaultCount: 1, erroredVaultCount: 0, affectedSafes: [] })
    await isSafeAffectedByZodiacVulnerability(CHAIN, SAFE)
    expect(global.fetch).toHaveBeenCalledWith(
      `https://zodiac-check.safe.global/public/api/security-check?safes=${encodeURIComponent(`${CHAIN}:${SAFE}`)}`,
    )
  })

  it('returns false and logs on a non-OK response', async () => {
    mockFetch({}, false)
    expect(await isSafeAffectedByZodiacVulnerability(CHAIN, SAFE)).toBe(false)
    expect(mockLogError).toHaveBeenCalledTimes(1)
  })

  it('returns false and logs when the request throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch
    expect(await isSafeAffectedByZodiacVulnerability(CHAIN, SAFE)).toBe(false)
    expect(mockLogError).toHaveBeenCalledTimes(1)
  })
})
