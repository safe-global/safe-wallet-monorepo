import { modulesScanner } from '../modules'
import { createMockContext } from '../test-helpers'

describe('modulesScanner', () => {
  it('returns clear when no modules are installed', async () => {
    const result = await modulesScanner.scan(createMockContext({ modules: null }))
    expect(result.status).toBe('clear')
    expect(result.severity).toBe('Low')
    expect(result.score).toBe(100)
  })

  it('returns clear for empty modules array', async () => {
    const result = await modulesScanner.scan(createMockContext({ modules: [] }))
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
  })

  it('returns clear when all modules are trusted by name', async () => {
    const result = await modulesScanner.scan(
      createMockContext({
        modules: [
          { value: '0x1111111111111111111111111111111111111111', name: 'Delay Modifier' },
          { value: '0x2222222222222222222222222222222222222222', name: 'Allowance Module' },
        ],
      }),
    )
    expect(result.status).toBe('clear')
    expect(result.severity).toBe('Low')
    expect(result.score).toBe(100)
    expect(result.evidence).toHaveLength(2)
  })

  it('returns clear when module matches a known Zodiac address', async () => {
    // Real Zodiac Delay Modifier v1.0.0 address on Ethereum mainnet
    const result = await modulesScanner.scan(
      createMockContext({
        chainId: '1',
        modules: [{ value: '0xD62129BF40CD1694b3d9D9847367783a1A4d5cB4' }],
      }),
    )
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
  })

  it('returns clear when module matches a known Allowance Module address', async () => {
    // Real Allowance Module v0.1.0 address on Ethereum mainnet
    const result = await modulesScanner.scan(
      createMockContext({
        chainId: '1',
        modules: [{ value: '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134' }],
      }),
    )
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
  })

  it('returns issue for a single untrusted module', async () => {
    const result = await modulesScanner.scan(
      createMockContext({
        modules: [{ value: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF' }],
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(20)
  })

  it('returns partial for a mix of trusted and one untrusted module', async () => {
    const result = await modulesScanner.scan(
      createMockContext({
        modules: [
          { value: '0x1111111111111111111111111111111111111111', name: 'Delay Modifier' },
          { value: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF' },
        ],
      }),
    )
    expect(result.status).toBe('partial')
    expect(result.severity).toBe('Medium')
    expect(result.score).toBe(50)
  })

  it('returns issue when multiple modules are untrusted', async () => {
    const result = await modulesScanner.scan(
      createMockContext({
        modules: [
          { value: '0xDEAD000000000000000000000000000000000001' },
          { value: '0xDEAD000000000000000000000000000000000002' },
        ],
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(20)
  })

  it('returns issue when trusted modules exist but more than 1 is untrusted', async () => {
    const result = await modulesScanner.scan(
      createMockContext({
        modules: [
          { value: '0x1111111111111111111111111111111111111111', name: 'Delay Modifier' },
          { value: '0xDEAD000000000000000000000000000000000001' },
          { value: '0xDEAD000000000000000000000000000000000002' },
        ],
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
  })

  it('filters out zero-address modules', async () => {
    const result = await modulesScanner.scan(
      createMockContext({
        modules: [{ value: '0x0000000000000000000000000000000000000000' }],
      }),
    )
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
  })

  it('includes lastChecked timestamp', async () => {
    const result = await modulesScanner.scan(createMockContext())
    expect(result.lastChecked).toBeDefined()
    expect(() => new Date(result.lastChecked)).not.toThrow()
  })

  it('recognizes various trusted module names', async () => {
    const trustedNames = ['Roles Modifier', 'Scope Guard', 'Bridge Module', 'Reality Module', 'Connext Module']

    for (const name of trustedNames) {
      const result = await modulesScanner.scan(
        createMockContext({
          modules: [{ value: '0x1111111111111111111111111111111111111111', name }],
        }),
      )
      expect(result.status).toBe('clear')
    }
  })
})
