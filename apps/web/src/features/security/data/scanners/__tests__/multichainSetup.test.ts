import { multichainSetupScanner } from '../multichainSetup'
import { createMockContext } from '../test-helpers'

describe('multichainSetupScanner', () => {
  it('returns not_applicable for single-chain Safe', async () => {
    const result = await multichainSetupScanner.scan(createMockContext({ isMultichain: false }))
    expect(result.status).toBe('not_applicable')
    expect(result.score).toBe(100)
  })

  it('returns clear for multichain Safe with consistent signers', async () => {
    const result = await multichainSetupScanner.scan(
      createMockContext({
        isMultichain: true,
        multichainSignersConsistent: true,
      }),
    )
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
  })

  it('returns issue for multichain Safe with inconsistent signers', async () => {
    const result = await multichainSetupScanner.scan(
      createMockContext({
        isMultichain: true,
        multichainSignersConsistent: false,
        multichainDeviatingChains: ['Polygon', 'Arbitrum'],
      }),
    )
    expect(result.status).toBe('partial')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(30)
  })

  it('includes affected chain names in evidence', async () => {
    const result = await multichainSetupScanner.scan(
      createMockContext({
        isMultichain: true,
        multichainSignersConsistent: false,
        multichainDeviatingChains: ['Polygon', 'Arbitrum'],
      }),
    )
    const affectedEvidence = result.evidence.find((e) => typeof e === 'object' && e.label === 'Affected')
    expect(affectedEvidence).toBeDefined()
    if (typeof affectedEvidence === 'object') {
      expect(affectedEvidence.value).toContain('Polygon')
      expect(affectedEvidence.value).toContain('Arbitrum')
    }
  })

  it('shows fallback text when no deviating chains listed', async () => {
    const result = await multichainSetupScanner.scan(
      createMockContext({
        isMultichain: true,
        multichainSignersConsistent: false,
        multichainDeviatingChains: [],
      }),
    )
    const affectedEvidence = result.evidence.find((e) => typeof e === 'object' && e.label === 'Affected')
    if (typeof affectedEvidence === 'object') {
      expect(affectedEvidence.value).toBe('Multiple networks')
    }
  })
})
