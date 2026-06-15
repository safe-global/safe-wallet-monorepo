import { factoryValidationScanner } from '../factoryValidation'
import { createMockContext } from '../test-helpers'

describe('factoryValidationScanner', () => {
  it('returns inconclusive when creation data has not loaded yet', async () => {
    // `inconclusive` is skipped in the workspace aggregate and per-Safe grade, so a
    // missing creation transaction (still loading or gateway returned no data yet)
    // won't penalize the score or surface a misleading "unrecognized source" entry.
    // It also keeps the result stable across rescans once creationTx resolves.
    const result = await factoryValidationScanner.scan(createMockContext({ creationInfo: null }))
    expect(result.status).toBe('inconclusive')
    expect(result.score).toBe(50)
  })

  it('returns partial when factory address is not recorded', async () => {
    const result = await factoryValidationScanner.scan(
      createMockContext({
        creationInfo: { factoryAddress: null, creator: '0x1234', masterCopy: null, transactionHash: '0xabc' },
      }),
    )
    expect(result.status).toBe('partial')
    expect(result.severity).toBe('Medium')
  })

  it('returns clear for a known official proxy factory', async () => {
    const result = await factoryValidationScanner.scan(
      createMockContext({
        chainId: '1',
        creationInfo: {
          factoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
          creator: '0x1234',
          masterCopy: null,
          transactionHash: '0xabc',
        },
      }),
    )
    expect(result.status).toBe('clear')
    expect(result.score).toBe(100)
  })

  it('returns partial for an unrecognized factory address', async () => {
    const result = await factoryValidationScanner.scan(
      createMockContext({
        chainId: '1',
        creationInfo: {
          factoryAddress: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF',
          creator: '0x1234',
          masterCopy: null,
          transactionHash: '0xabc',
        },
      }),
    )
    expect(result.status).toBe('partial')
    expect(result.severity).toBe('Medium')
    expect(result.score).toBe(60)
  })

  it('includes lastChecked timestamp', async () => {
    const result = await factoryValidationScanner.scan(createMockContext())
    expect(result.lastChecked).toBeDefined()
    expect(() => new Date(result.lastChecked)).not.toThrow()
  })
})
