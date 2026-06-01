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

  it('returns issue for outdated Gnosis-deployed mastercopy (non-L2)', async () => {
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

  it('returns issue for 1.3.0+L2 when chain latest is 1.4.1 (WA-2370)', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        implementationVersionState: 'OUTDATED',
        // gateway returns true for 1.3.0+L2 because `>= 1.3.0`; the scanner must
        // ignore that flag and compare against the chain's latest version instead
        isNonCriticalUpdate: true,
        masterCopyDeployer: 'Gnosis',
        version: '1.3.0+L2',
        latestVersion: '1.4.1',
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(30)
  })

  it('returns issue for 1.4.1 when chain latest is 1.5.1 (future upgrade)', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        implementationVersionState: 'OUTDATED',
        isNonCriticalUpdate: true,
        masterCopyDeployer: 'Gnosis',
        version: '1.4.1',
        latestVersion: '1.5.1',
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
  })

  it('returns clear for 1.4.1+L2 when chain latest is 1.4.1 (L2 metadata equals latest)', async () => {
    // implementationVersionState is UP_TO_DATE here because the gateway already
    // considers 1.4.1+L2 equivalent to 1.4.1. Default ctx state covers this.
    const result = await contractVersionScanner.scan(
      createMockContext({
        version: '1.4.1+L2',
        latestVersion: '1.4.1',
      }),
    )
    expect(result.status).toBe('clear')
  })

  it('defers to gateway and returns issue when implementationVersionState is OUTDATED but version is null', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        implementationVersionState: 'OUTDATED',
        isNonCriticalUpdate: false,
        masterCopyDeployer: 'Gnosis',
        version: null,
        latestVersion: '1.4.1',
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(30)
  })

  it('defers to gateway and returns issue when implementationVersionState is OUTDATED but version is not valid semver', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        implementationVersionState: 'OUTDATED',
        isNonCriticalUpdate: false,
        masterCopyDeployer: 'Gnosis',
        version: 'not-a-version',
        latestVersion: '1.4.1',
      }),
    )
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(30)
  })

  it('trusts semver over gateway OUTDATED when semver confirms version is current (1.4.1+L2 vs 1.4.1)', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        implementationVersionState: 'OUTDATED',
        isNonCriticalUpdate: true,
        masterCopyDeployer: 'Gnosis',
        version: '1.4.1+L2',
        latestVersion: '1.4.1',
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
        version: '1.3.0',
        latestVersion: '1.4.1',
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

  it('returns partial when original deployment used unrecognized implementation', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        creationInfo: {
          factoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
          creator: '0x1234',
          masterCopy: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF',
          transactionHash: '0xabc',
        },
      }),
    )
    expect(result.status).toBe('partial')
    expect(result.severity).toBe('Medium')
    expect(result.score).toBe(60)
  })

  it('returns clear when creation master copy is a known deployment', async () => {
    const result = await contractVersionScanner.scan(
      createMockContext({
        chainId: '1',
        creationInfo: {
          factoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
          creator: '0x1234',
          masterCopy: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
          transactionHash: '0xabc',
        },
      }),
    )
    expect(result.status).toBe('clear')
  })
})
