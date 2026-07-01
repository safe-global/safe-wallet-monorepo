import { guardScanner } from '../guard'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { HIGH_VALUE_THRESHOLD_USD } from '../constants'
import { createMockContext } from '../test-helpers'

describe('guardScanner', () => {
  describe('Tier 1: untrusted guard', () => {
    it('returns issue for unknown guard with name', async () => {
      const ctx = createMockContext({
        guard: { value: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'UnknownGuard' },
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('High')
      expect(result.ctaLabelOverride).toBe('Review modules')
    })

    it('returns issue for unknown guard without name', async () => {
      const ctx = createMockContext({
        guard: { value: '0xabcdef1234567890abcdef1234567890abcdef12', name: null },
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('issue')
      expect(result.severity).toBe('High')
    })
  })

  describe('Tier 2: trusted guards', () => {
    it('returns clear with partner tag for Hypernative guard', async () => {
      const ctx = createMockContext({
        guard: { value: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Hypernative Guardian' },
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('clear')
      expect(result.severity).toBe('Low')
      expect(result.partner).toBe('hypernative')
      expect(result.score).toBe(100)
    })

    it('matches Hypernative case-insensitively', async () => {
      const ctx = createMockContext({
        guard: { value: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'HYPERNATIVE guard v2' },
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('clear')
      expect(result.partner).toBe('hypernative')
    })

    it('returns clear for Zodiac ScopeGuard by name (no partner tag)', async () => {
      const ctx = createMockContext({
        guard: { value: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Scope Guard' },
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('clear')
      expect(result.severity).toBe('Low')
      expect(result.partner).toBeUndefined()
    })

    it('returns clear for Zodiac MetaGuard by name', async () => {
      const ctx = createMockContext({
        guard: { value: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Meta Guard v1' },
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('clear')
      expect(result.partner).toBeUndefined()
    })
  })

  describe('Tier 3: high-value Safe without guard on supported chain', () => {
    it('returns partial with partner tag when balance exceeds threshold', async () => {
      const ctx = createMockContext({
        guard: null,
        chainSupportsHypernative: true,
        balanceUsd: HIGH_VALUE_THRESHOLD_USD + 1,
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('partial')
      expect(result.severity).toBe('Medium')
      expect(result.partner).toBe('hypernative')
      expect(result.ctaLabelOverride).toBe('Set up protection')
    })

    it('does not recommend for balance at threshold', async () => {
      const ctx = createMockContext({
        guard: null,
        chainSupportsHypernative: true,
        balanceUsd: HIGH_VALUE_THRESHOLD_USD,
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('not_applicable')
      expect(result.partner).toBeUndefined()
    })

    // Regression: WA-2369 — non-zero balances below the threshold must not trigger the
    // recommendation. Derived from the constant so it stays correct if the threshold moves.
    it.each([1, 2, HIGH_VALUE_THRESHOLD_USD - 1])(
      'returns not_applicable for low non-zero balance ($%i) on supported chain',
      async (balanceUsd) => {
        const ctx = createMockContext({
          guard: null,
          chainSupportsHypernative: true,
          balanceUsd,
        })
        const result = await guardScanner.scan(ctx)
        expect(result.status).toBe('not_applicable')
        expect(result.partner).toBeUndefined()
      },
    )
  })

  describe('Tier 4: no guard needed', () => {
    it('returns not_applicable for no guard on unsupported chain', async () => {
      const ctx = createMockContext({
        guard: null,
        chainSupportsHypernative: false,
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('not_applicable')
      expect(result.severity).toBe('Low')
      expect(result.partner).toBeUndefined()
    })

    it('returns not_applicable for low-value Safe on supported chain', async () => {
      const ctx = createMockContext({
        guard: null,
        chainSupportsHypernative: true,
        balanceUsd: 0,
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('not_applicable')
    })

    it('treats zero address guard as no guard', async () => {
      const ctx = createMockContext({
        guard: { value: ZERO_ADDRESS, name: null },
      })
      const result = await guardScanner.scan(ctx)
      expect(result.status).toBe('not_applicable')
    })
  })
})
