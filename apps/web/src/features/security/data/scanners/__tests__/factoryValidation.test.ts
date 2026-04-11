import { factoryValidationScanner } from '../factoryValidation'
import { createMockContext } from '../test-helpers'

describe('factoryValidationScanner', () => {
  it('returns clear when no creation data is available', async () => {
    const result = await factoryValidationScanner.scan(createMockContext({ creationInfo: null }))
    expect(result.status).toBe('clear')
    expect(result.score).toBe(90)
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

  it('returns issue for an unrecognized factory address', async () => {
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
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(20)
  })

  it('includes lastChecked timestamp', async () => {
    const result = await factoryValidationScanner.scan(createMockContext())
    expect(result.lastChecked).toBeDefined()
    expect(() => new Date(result.lastChecked)).not.toThrow()
  })
})
