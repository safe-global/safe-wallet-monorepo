import { fallbackHandlerScanner } from '../fallbackHandler'
import { createMockContext } from '../test-helpers'

describe('fallbackHandlerScanner', () => {
  it('returns clear when no fallback handler is set', async () => {
    const result = await fallbackHandlerScanner.scan(createMockContext({ fallbackHandler: null }))
    expect(result.status).toBe('clear')
    expect(result.severity).toBe('Low')
    expect(result.score).toBe(100)
  })

  it('returns clear when fallback handler is the zero address', async () => {
    const result = await fallbackHandlerScanner.scan(
      createMockContext({ fallbackHandler: { value: '0x0000000000000000000000000000000000000000' } }),
    )
    expect(result.status).toBe('clear')
  })

  it('returns clear for a known official fallback handler', async () => {
    // CompatibilityFallbackHandler v1.3.0 on Ethereum mainnet
    const result = await fallbackHandlerScanner.scan(
      createMockContext({
        chainId: '1',
        fallbackHandler: { value: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4' },
      }),
    )
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
  })

  it('returns issue for an unrecognized fallback handler', async () => {
    const result = await fallbackHandlerScanner.scan(
      createMockContext({
        chainId: '1',
        fallbackHandler: { value: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF' },
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(20)
  })

  it('includes handler name in evidence when available', async () => {
    const result = await fallbackHandlerScanner.scan(
      createMockContext({
        chainId: '1',
        fallbackHandler: { value: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF', name: 'Suspicious Handler' },
      }),
    )
    expect(result.evidence).toEqual(expect.arrayContaining([expect.objectContaining({ value: 'Suspicious Handler' })]))
  })

  it('returns clear for CoW TWAP handler on supported chain', async () => {
    const result = await fallbackHandlerScanner.scan(
      createMockContext({
        chainId: '1',
        fallbackHandler: { value: '0x2f55e8b20D0B9FEFA187AA7d00B6Cbe563605bF5', name: 'TWAP Handler' },
      }),
    )
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
    expect(result.evidence).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'CoW Protocol TWAP handler' })]),
    )
  })

  it('returns issue for CoW TWAP handler on unsupported chain', async () => {
    const result = await fallbackHandlerScanner.scan(
      createMockContext({
        chainId: '999999',
        fallbackHandler: { value: '0x2f55e8b20D0B9FEFA187AA7d00B6Cbe563605bF5' },
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
  })

  it('includes lastChecked timestamp', async () => {
    const result = await fallbackHandlerScanner.scan(createMockContext())
    expect(result.lastChecked).toBeDefined()
    expect(() => new Date(result.lastChecked)).not.toThrow()
  })
})
