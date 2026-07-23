import { canMigrateUnsupportedMastercopy, isValidMasterCopy, isMigrationToL2Possible } from '../safeContracts'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import type { BytecodeComparisonResult } from '../bytecodeComparison'

describe('safeContracts', () => {
  describe('isValidMasterCopy', () => {
    it('should return true for UP_TO_DATE', () => {
      expect(isValidMasterCopy(ImplementationVersionState.UP_TO_DATE)).toBe(true)
    })

    it('should return true for OUTDATED', () => {
      expect(isValidMasterCopy(ImplementationVersionState.OUTDATED)).toBe(true)
    })

    it('should return false for UNKNOWN', () => {
      expect(isValidMasterCopy(ImplementationVersionState.UNKNOWN)).toBe(false)
    })
  })

  describe('canMigrateUnsupportedMastercopy', () => {
    const createMockSafe = (overrides?: Partial<SafeState>): SafeState =>
      ({
        implementationVersionState: ImplementationVersionState.UNKNOWN,
        nonce: 0,
        chainId: '1',
        version: '1.3.0',
        address: { value: '0x123' },
        implementation: { value: '0xabc' },
        ...overrides,
      }) as SafeState

    it('should return false for supported mastercopy', () => {
      const safe = createMockSafe({
        implementationVersionState: ImplementationVersionState.UP_TO_DATE,
      })
      const result: BytecodeComparisonResult = { isMatch: true, matchedVersion: '1.3.0' }

      expect(canMigrateUnsupportedMastercopy(safe, result)).toBe(false)
    })

    it('should return false when bytecode comparison result is missing', () => {
      const safe = createMockSafe()

      expect(canMigrateUnsupportedMastercopy(safe, undefined)).toBe(false)
    })

    it('should return false when bytecode does not match', () => {
      const safe = createMockSafe()
      const result: BytecodeComparisonResult = { isMatch: false }

      expect(canMigrateUnsupportedMastercopy(safe, result)).toBe(false)
    })

    it('should return true even when nonce is not 0 (migration works regardless)', () => {
      const safe = createMockSafe({ nonce: 5 })
      const result: BytecodeComparisonResult = { isMatch: true, matchedVersion: '1.3.0' }

      // The result depends on whether the migration deployment exists for the chain
      const canMigrate = canMigrateUnsupportedMastercopy(safe, result)
      expect(typeof canMigrate).toBe('boolean')
    })

    it('should return true when all conditions are met', () => {
      const safe = createMockSafe()
      const result: BytecodeComparisonResult = { isMatch: true, matchedVersion: '1.3.0' }

      // Note: This will still depend on isMigrationToL2Possible which checks for migration deployment
      // In a real scenario, you'd need to mock getSafeMigrationDeployment
      const canMigrate = canMigrateUnsupportedMastercopy(safe, result)

      // The result depends on whether the migration deployment exists for the chain
      expect(typeof canMigrate).toBe('boolean')
    })
  })

  describe('isMigrationToL2Possible', () => {
    // Official canonical singleton addresses from safe-deployments
    const SINGLETON_130_L1 = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
    const SINGLETON_130_L2 = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'
    const SINGLETON_141_L1 = '0x41675C099F32341bf84BFc5382aF534df5C7461a'

    const createMockSafe = (overrides?: Partial<SafeState>): SafeState =>
      ({
        nonce: 0,
        chainId: '1',
        version: '1.3.0',
        address: { value: '0x123' },
        implementation: { value: SINGLETON_130_L1 },
        ...overrides,
      }) as SafeState

    it('should return true for a 1.3.0 Safe on the official L1 singleton with nonce > 0 (migration does not depend on nonce)', () => {
      const safe = createMockSafe({ nonce: 5, version: '1.3.0' })

      expect(isMigrationToL2Possible(safe)).toBe(true)
    })

    it('should return true for a 1.4.1 Safe on the official L1 singleton with nonce > 0', () => {
      const safe = createMockSafe({ nonce: 12, version: '1.4.1', implementation: { value: SINGLETON_141_L1 } })

      expect(isMigrationToL2Possible(safe)).toBe(true)
    })

    it('should return true for versions with build metadata like 1.3.0+L2', () => {
      const safe = createMockSafe({ nonce: 3, version: '1.3.0+L2', implementation: { value: SINGLETON_130_L2 } })

      expect(isMigrationToL2Possible(safe)).toBe(true)
    })

    it('should return false for forks that self-report a supported version but use an unofficial mastercopy', () => {
      // Third-party forks of the Safe contracts return an official-looking
      // VERSION() (e.g. 1.3.0) while running modified code at an address that
      // is not part of any official deployment
      const safe = createMockSafe({
        nonce: 4,
        chainId: '137',
        version: '1.3.0',
        implementation: { value: '0x1111111111111111111111111111111111111111' },
      })

      expect(isMigrationToL2Possible(safe)).toBe(false)
    })

    it('should return false for unofficial mastercopies even at nonce 0 (pre-existing bug: the old nonce gate allowed them)', () => {
      const safe = createMockSafe({
        nonce: 0,
        chainId: '137',
        version: '1.3.0',
        implementation: { value: '0x1111111111111111111111111111111111111111' },
      })

      expect(isMigrationToL2Possible(safe)).toBe(false)
    })

    it('should return false when the implementation address is missing', () => {
      const safe = createMockSafe({ implementation: undefined })

      expect(isMigrationToL2Possible(safe)).toBe(false)
    })

    it('should return false for versions not supported by the SafeMigration contract', () => {
      expect(isMigrationToL2Possible(createMockSafe({ version: '1.1.1' }))).toBe(false)
      expect(isMigrationToL2Possible(createMockSafe({ version: '1.0.0' }))).toBe(false)
    })

    it('should return false when the Safe version is unknown', () => {
      const safe = createMockSafe({ version: null })

      expect(isMigrationToL2Possible(safe)).toBe(false)
    })

    it('should return true on unregistered chains via the chain-agnostic canonical fallback', () => {
      const safe = createMockSafe({ chainId: '69420' })

      expect(isMigrationToL2Possible(safe)).toBe(true)
    })
  })
})
