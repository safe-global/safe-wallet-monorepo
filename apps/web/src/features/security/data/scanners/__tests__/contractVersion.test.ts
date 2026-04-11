import { contractVersionScanner } from '../contractVersion'
import { createMockContext } from '../test-helpers'

jest.mock('@safe-global/utils/services/contracts/safeContracts', () => ({
  isValidMasterCopy: jest.fn(),
  isMigrationToL2Possible: jest.fn(),
}))

import { isValidMasterCopy, isMigrationToL2Possible } from '@safe-global/utils/services/contracts/safeContracts'

const mockIsValidMasterCopy = isValidMasterCopy as jest.Mock
const mockIsMigrationToL2Possible = isMigrationToL2Possible as jest.Mock

describe('contractVersionScanner', () => {
  beforeEach(() => {
    mockIsValidMasterCopy.mockReturnValue(true)
    mockIsMigrationToL2Possible.mockReturnValue(false)
  })

  it('returns critical issue for unsupported mastercopy', async () => {
    mockIsValidMasterCopy.mockReturnValue(false)
    mockIsMigrationToL2Possible.mockReturnValue(false)

    const result = await contractVersionScanner.scan(createMockContext({ implementationVersionState: 'UNKNOWN' }))
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('Critical')
    expect(result.score).toBe(10)
  })

  it('suggests migration when L2 migration is possible', async () => {
    mockIsValidMasterCopy.mockReturnValue(false)
    mockIsMigrationToL2Possible.mockReturnValue(true)

    const result = await contractVersionScanner.scan(createMockContext({ implementationVersionState: 'UNKNOWN' }))
    expect(result.status).toBe('issue')
    expect(result.remediation).toContain('migrate')
    expect(result.ctaLabelOverride).toBe('Migrate')
  })

  it('returns issue for outdated Gnosis-deployed mastercopy', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        implementationVersionState: 'OUTDATED',
        isNonCriticalUpdate: false,
        masterCopyDeployer: 'Gnosis',
        version: '1.3.0',
        latestVersion: '1.4.1',
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
  })

  it('returns clear for outdated non-critical update', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        implementationVersionState: 'OUTDATED',
        isNonCriticalUpdate: true,
        masterCopyDeployer: 'Gnosis',
      }),
    )
    expect(result.status).toBe('clear')
  })

  it('returns clear for outdated non-Gnosis deployer', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        implementationVersionState: 'OUTDATED',
        isNonCriticalUpdate: false,
        masterCopyDeployer: 'Circles',
      }),
    )
    expect(result.status).toBe('clear')
  })

  it('returns clear for up-to-date version with known implementation', async () => {
    const result = await contractVersionScanner.scan(createMockContext())
    expect(result.status).toBe('clear')
    expect(result.severity).toBe('Low')
    expect(result.score).toBe(100)
  })

  it('returns issue for up-to-date version with unrecognized implementation address', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        implementationAddress: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF',
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(30)
  })

  it('returns clear for known L2 singleton address', async () => {
    // Safe L2 v1.3.0 on mainnet
    const result = await contractVersionScanner.scan(
      createMockContext({
        chainId: '1',
        implementationAddress: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
      }),
    )
    expect(result.status).toBe('clear')
  })
})
