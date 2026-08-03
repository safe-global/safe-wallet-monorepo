import { modulesScanner } from '../modules'
import { createMockContext } from '../test-helpers'
import { isSafeAffectedByZodiacVulnerability } from '../../../services/vulnerableModules'

jest.mock('../../../services/vulnerableModules', () => ({
  isSafeAffectedByZodiacVulnerability: jest.fn().mockResolvedValue(false),
}))

const mockIsAffected = isSafeAffectedByZodiacVulnerability as jest.MockedFunction<
  typeof isSafeAffectedByZodiacVulnerability
>

describe('modulesScanner', () => {
  beforeEach(() => {
    mockIsAffected.mockReset()
    mockIsAffected.mockResolvedValue(false)
  })

  it('returns not_applicable when no modules are installed', async () => {
    const result = await modulesScanner.scan(createMockContext({ modules: null }))
    expect(result.status).toBe('not_applicable')
    expect(result.severity).toBe('Low')
    expect(result.score).toBe(100)
  })

  it('returns not_applicable for empty modules array', async () => {
    const result = await modulesScanner.scan(createMockContext({ modules: [] }))
    expect(result.status).toBe('not_applicable')
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
    expect(result.status).toBe('not_applicable')
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

  describe('known Zodiac vulnerability', () => {
    it('does not call the security-check API when there are no modules', async () => {
      await modulesScanner.scan(createMockContext({ modules: [] }))
      expect(mockIsAffected).not.toHaveBeenCalled()
    })

    it('flags a vulnerable Delay module as Critical with a remove CTA', async () => {
      mockIsAffected.mockResolvedValue(true)
      const delay = { value: '0x1111111111111111111111111111111111111111', name: 'Delay Modifier' }
      const result = await modulesScanner.scan(createMockContext({ modules: [delay] }))

      expect(result.status).toBe('issue')
      expect(result.severity).toBe('Critical')
      expect(result.score).toBe(0)
      expect(result.ctaLabelOverride).toBe('Remove unsupported module')
      expect(result.vulnerableModules).toEqual([delay.value])
      expect(result.evidence).toContainEqual({ label: 'Vulnerable module', value: 'Delay Modifier' })
    })

    it('flags a vulnerable Roles module as Critical', async () => {
      mockIsAffected.mockResolvedValue(true)
      const roles = { value: '0x2222222222222222222222222222222222222222', name: 'Roles Modifier' }
      const result = await modulesScanner.scan(createMockContext({ modules: [roles] }))

      expect(result.severity).toBe('Critical')
      expect(result.vulnerableModules).toEqual([roles.value])
    })

    it('returns Critical warning without a remove target when affected via a related Safe', async () => {
      mockIsAffected.mockResolvedValue(true)
      // Affected, but no installed module matches Delay/Roles by name (nested case).
      const result = await modulesScanner.scan(
        createMockContext({ modules: [{ value: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF' }] }),
      )

      expect(result.status).toBe('issue')
      expect(result.severity).toBe('Critical')
      expect(result.vulnerableModules).toEqual([])
      expect(result.ctaLabelOverride).toBeUndefined()
    })

    it('falls back to the trust tiers when the Safe is not affected', async () => {
      mockIsAffected.mockResolvedValue(false)
      const result = await modulesScanner.scan(
        createMockContext({
          modules: [{ value: '0x1111111111111111111111111111111111111111', name: 'Delay Modifier' }],
        }),
      )

      expect(result.status).toBe('clear')
      expect(result.severity).toBe('Low')
      expect(result.vulnerableModules).toBeUndefined()
    })
  })

  describe('unsupported Zodiac mastercopies', () => {
    // Zodiac Delay Modifier v1.1.0 mastercopy enabled directly as a module. The server-side
    // security-check reports these Safes as `safe`, and CGW returns no name — so only the
    // address ruleset catches it.
    const UNSUPPORTED_MASTERCOPY = '0x01F8cabB808D7dE0dF4202D4B60C8310d2f1339b'

    it('flags a known-unsupported Zodiac mastercopy as Critical even when the API reports safe', async () => {
      mockIsAffected.mockResolvedValue(false)
      const result = await modulesScanner.scan(
        createMockContext({ chainId: '1', modules: [{ value: UNSUPPORTED_MASTERCOPY, name: null }] }),
      )

      expect(result.status).toBe('issue')
      expect(result.severity).toBe('Critical')
      expect(result.score).toBe(0)
      expect(result.ctaLabelOverride).toBe('Remove unsupported module')
      expect(result.vulnerableModules).toEqual([UNSUPPORTED_MASTERCOPY])
      expect(result.evidence).toContainEqual({ label: 'Vulnerable module', value: UNSUPPORTED_MASTERCOPY })
    })

    it('matches the unsupported mastercopy case-insensitively', async () => {
      mockIsAffected.mockResolvedValue(false)
      const lowercased = UNSUPPORTED_MASTERCOPY.toLowerCase()
      const result = await modulesScanner.scan(
        createMockContext({ chainId: '1', modules: [{ value: lowercased, name: null }] }),
      )

      expect(result.severity).toBe('Critical')
      expect(result.vulnerableModules).toEqual([lowercased])
    })

    it('does not double-list a mastercopy matched by both address and API name', async () => {
      mockIsAffected.mockResolvedValue(true)
      const result = await modulesScanner.scan(
        createMockContext({ chainId: '1', modules: [{ value: UNSUPPORTED_MASTERCOPY, name: 'Delay Modifier' }] }),
      )

      expect(result.severity).toBe('Critical')
      expect(result.vulnerableModules).toEqual([UNSUPPORTED_MASTERCOPY])
    })

    it('flags the unsupported mastercopy alongside other untrusted modules', async () => {
      mockIsAffected.mockResolvedValue(false)
      const result = await modulesScanner.scan(
        createMockContext({
          chainId: '1',
          modules: [
            { value: UNSUPPORTED_MASTERCOPY, name: null },
            { value: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF', name: null },
          ],
        }),
      )

      expect(result.severity).toBe('Critical')
      expect(result.vulnerableModules).toEqual([UNSUPPORTED_MASTERCOPY])
    })
  })
})
