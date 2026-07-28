import { compareWithOfficialSingletons, isSupportedMigrationVersion } from '../bytecodeComparison'
import * as safeDeployments from '@safe-global/safe-deployments'
import { keccak256 } from 'ethers'

jest.mock('@safe-global/safe-deployments', () => ({
  getSafeSingletonDeployments: jest.fn(),
  getSafeL2SingletonDeployments: jest.fn(),
}))

const mockGetL1 = jest.mocked(safeDeployments.getSafeSingletonDeployments)
const mockGetL2 = jest.mocked(safeDeployments.getSafeL2SingletonDeployments)

type Deployment = ReturnType<typeof safeDeployments.getSafeSingletonDeployments>

// Official singleton addresses (for realism — the comparison keys off codeHash, not address).
const OFFICIAL_L1_130 = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
const OFFICIAL_L1_141 = '0x41675C099F32341bf84BFc5382aF534df5C7461a'
const OFFICIAL_L2_130 = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'

const RECOMMENDED = '1.4.1'

const mockBytecode =
  '0x608060405234801561001057600080fd5b50600436106100365760003560e01c8063ffa1ad741461003b575b600080fd5b610043610059565b60405161005091906100a3565b60405180910390f35b6060604051806040016040528060058152602001'
const mockBytecodeHash = keccak256(mockBytecode)

const singleton = (version: string, variants: Record<string, { address: string; codeHash: string }>): Deployment =>
  ({
    released: true,
    contractName: 'Safe',
    version,
    deployments: variants,
    networkAddresses: {},
  }) as unknown as Deployment

describe('bytecodeComparison', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetL1.mockReturnValue(undefined)
    mockGetL2.mockReturnValue(undefined)
  })

  describe('isSupportedMigrationVersion', () => {
    it.each(['1.3.0', '1.4.0', '1.4.1', '1.3.0+L2', '1.4.1+L2'])(
      'returns true for %s within [1.3.0 .. recommended]',
      (version) => {
        expect(isSupportedMigrationVersion(version, RECOMMENDED)).toBe(true)
      },
    )

    it.each(['1.1.1', '1.2.0', '1.5.0', '2.0.0'])('returns false for %s outside [1.3.0 .. recommended]', (version) => {
      expect(isSupportedMigrationVersion(version, RECOMMENDED)).toBe(false)
    })

    it('follows the recommended ceiling', () => {
      expect(isSupportedMigrationVersion('1.5.0', '1.4.1')).toBe(false)
      expect(isSupportedMigrationVersion('1.5.0', '1.5.0')).toBe(true)
      expect(isSupportedMigrationVersion('1.4.1', '1.5.0')).toBe(true)
    })
  })

  describe('compareWithOfficialSingletons', () => {
    it('matches an official L1 1.3.0 singleton', async () => {
      mockGetL1.mockImplementation((filter) =>
        filter?.version === '1.3.0'
          ? singleton('1.3.0', { canonical: { address: OFFICIAL_L1_130, codeHash: mockBytecodeHash } })
          : undefined,
      )

      const result = await compareWithOfficialSingletons(mockBytecode, RECOMMENDED)

      expect(result).toEqual({ isMatch: true, matchedVersion: '1.3.0' })
    })

    it('matches an official L1 1.4.1 singleton', async () => {
      mockGetL1.mockImplementation((filter) =>
        filter?.version === '1.4.1'
          ? singleton('1.4.1', { canonical: { address: OFFICIAL_L1_141, codeHash: mockBytecodeHash } })
          : undefined,
      )

      const result = await compareWithOfficialSingletons(mockBytecode, RECOMMENDED)

      expect(result).toEqual({ isMatch: true, matchedVersion: '1.4.1' })
    })

    it('matches an official L2 singleton on its eip155 variant', async () => {
      mockGetL2.mockImplementation((filter) =>
        filter?.version === '1.3.0'
          ? singleton('1.3.0', {
              canonical: { address: OFFICIAL_L2_130, codeHash: '0xdifferenthash' },
              eip155: { address: '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA', codeHash: mockBytecodeHash },
            })
          : undefined,
      )

      const result = await compareWithOfficialSingletons(mockBytecode, RECOMMENDED)

      expect(result).toEqual({ isMatch: true, matchedVersion: '1.3.0' })
    })

    it('matches on codeHash even when no chain lists the singleton (chain gate removed)', async () => {
      mockGetL2.mockImplementation((filter) =>
        filter?.version === '1.3.0'
          ? singleton('1.3.0', { canonical: { address: OFFICIAL_L2_130, codeHash: mockBytecodeHash } })
          : undefined,
      )

      const result = await compareWithOfficialSingletons(mockBytecode, RECOMMENDED)

      expect(result).toEqual({ isMatch: true, matchedVersion: '1.3.0' })
    })

    it('iterates L1+L2 getters for the range [1.3.0 .. recommended] and no higher', async () => {
      await compareWithOfficialSingletons(mockBytecode, RECOMMENDED)

      expect(mockGetL1).toHaveBeenCalledWith({ version: '1.3.0' })
      expect(mockGetL1).toHaveBeenCalledWith({ version: '1.4.1' })
      expect(mockGetL2).toHaveBeenCalledWith({ version: '1.3.0' })
      expect(mockGetL2).toHaveBeenCalledWith({ version: '1.4.1' })
      expect(mockGetL1).not.toHaveBeenCalledWith({ version: '1.5.0' })
      expect(mockGetL2).not.toHaveBeenCalledWith({ version: '1.5.0' })
    })

    it('extends the range when recommended is 1.5.0', async () => {
      await compareWithOfficialSingletons(mockBytecode, '1.5.0')

      expect(mockGetL1).toHaveBeenCalledWith({ version: '1.5.0' })
      expect(mockGetL2).toHaveBeenCalledWith({ version: '1.5.0' })
    })

    it('returns isMatch: false for a third-party fork (no codeHash match)', async () => {
      mockGetL1.mockImplementation((filter) =>
        filter?.version === '1.3.0'
          ? singleton('1.3.0', { canonical: { address: OFFICIAL_L1_130, codeHash: '0xnotamatch' } })
          : undefined,
      )
      mockGetL2.mockImplementation((filter) =>
        filter?.version === '1.4.1'
          ? singleton('1.4.1', { canonical: { address: OFFICIAL_L2_130, codeHash: '0xalsonotamatch' } })
          : undefined,
      )

      const result = await compareWithOfficialSingletons(mockBytecode, RECOMMENDED)

      expect(result).toEqual({ isMatch: false })
    })

    it('returns isMatch: false when no official deployments are registered', async () => {
      const result = await compareWithOfficialSingletons(mockBytecode, RECOMMENDED)

      expect(result).toEqual({ isMatch: false })
    })
  })
})
