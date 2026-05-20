import { signerIntegrityScanner } from '../signerIntegrity'
import { createMockContext } from '../test-helpers'

describe('signerIntegrityScanner', () => {
  it('returns inconclusive with signer count (CGW endpoint not yet available)', async () => {
    const owners = [
      { value: '0x1111111111111111111111111111111111111111' },
      { value: '0x2222222222222222222222222222222222222222' },
      { value: '0x3333333333333333333333333333333333333333' },
    ]
    const result = await signerIntegrityScanner.scan(createMockContext({ owners }))
    expect(result.status).toBe('inconclusive')
    expect(result.severity).toBe('Medium')
    expect(result.score).toBe(50)
    expect(result.evidence).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'Signers', value: '3' })]))
  })

  it('includes a lastChecked timestamp', async () => {
    const result = await signerIntegrityScanner.scan(createMockContext())
    expect(result.lastChecked).toBeDefined()
    expect(() => new Date(result.lastChecked)).not.toThrow()
  })
})
