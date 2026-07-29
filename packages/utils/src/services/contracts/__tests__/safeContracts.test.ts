import { isUnsupportedMastercopyMigratable, getMastercopyAction, isValidMasterCopy } from '../safeContracts'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import * as safeDeployments from '@safe-global/safe-deployments'

// Keep the real singleton getters (so isOfficialMasterCopy resolves real addresses)
// but make the migration getter overridable to simulate "not deployed on this chain".
jest.mock('@safe-global/safe-deployments', () => {
  const actual = jest.requireActual('@safe-global/safe-deployments')
  return {
    ...actual,
    getSafeMigrationDeployments: jest.fn(actual.getSafeMigrationDeployments),
  }
})

const OFFICIAL_L1_130 = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
const OFFICIAL_L1_141 = '0x41675C099F32341bf84BFc5382aF534df5C7461a'
const OFFICIAL_L2_130 = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'
const OFFICIAL_L1_141_ZKSYNC = '0xC35F063962328aC65cED5D4c3fC5dEf8dec68dFa'
const OFFICIAL_L2_141_ZKSYNC = '0x610fcA2e0279Fa1F8C00c8c2F71dF522AD469380'
const UNOFFICIAL = '0x000000000000000000000000000000000000dEaD'

type MigratableSafe = Pick<SafeState, 'implementationVersionState' | 'version' | 'chainId' | 'implementation'>

const createSafe = (overrides?: Partial<MigratableSafe>): MigratableSafe => ({
  implementationVersionState: ImplementationVersionState.UNKNOWN,
  chainId: '1',
  version: '1.3.0',
  implementation: { value: OFFICIAL_L1_130 },
  ...overrides,
})

describe('safeContracts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

  describe('isUnsupportedMastercopyMigratable', () => {
    it('returns false for an UP_TO_DATE Safe regardless of everything else', () => {
      const safe = createSafe({ implementationVersionState: ImplementationVersionState.UP_TO_DATE })
      expect(
        isUnsupportedMastercopyMigratable(safe, { bytecodeResult: { isMatch: true, matchedVersion: '1.3.0' } }),
      ).toBe(false)
    })

    it('returns false for an OUTDATED Safe regardless of everything else', () => {
      const safe = createSafe({ implementationVersionState: ImplementationVersionState.OUTDATED })
      expect(
        isUnsupportedMastercopyMigratable(safe, { bytecodeResult: { isMatch: true, matchedVersion: '1.3.0' } }),
      ).toBe(false)
    })

    it('returns true for UNKNOWN + official L1 1.3.0 singleton (WA-1685)', () => {
      expect(
        isUnsupportedMastercopyMigratable(createSafe({ version: '1.3.0', implementation: { value: OFFICIAL_L1_130 } })),
      ).toBe(true)
    })

    it('returns true for UNKNOWN + official L1 1.4.1 singleton', () => {
      expect(
        isUnsupportedMastercopyMigratable(createSafe({ version: '1.4.1', implementation: { value: OFFICIAL_L1_141 } })),
      ).toBe(true)
    })

    it('returns true for UNKNOWN + official L2 singleton', () => {
      expect(
        isUnsupportedMastercopyMigratable(createSafe({ version: '1.3.0', implementation: { value: OFFICIAL_L2_130 } })),
      ).toBe(true)
    })

    it('returns true for UNKNOWN + official zksync-variant singleton on a zkEVM chain', () => {
      expect(
        isUnsupportedMastercopyMigratable(
          createSafe({ chainId: '324', version: '1.4.1', implementation: { value: OFFICIAL_L2_141_ZKSYNC } }),
        ),
      ).toBe(true)
      expect(
        isUnsupportedMastercopyMigratable(
          createSafe({ chainId: '324', version: '1.4.1', implementation: { value: OFFICIAL_L1_141_ZKSYNC } }),
        ),
      ).toBe(true)
    })

    it('returns true for UNKNOWN + bytecode match even when the address is unofficial (opBNB redeploy)', () => {
      const safe = createSafe({ version: '1.3.0', implementation: { value: UNOFFICIAL } })
      expect(
        isUnsupportedMastercopyMigratable(safe, { bytecodeResult: { isMatch: true, matchedVersion: '1.3.0' } }),
      ).toBe(true)
    })

    it('returns false for a third-party fork (unofficial address, no bytecode match) at any nonce (WA-2906)', () => {
      const forkAtNonceZero = { ...createSafe({ version: '1.3.0', implementation: { value: UNOFFICIAL } }), nonce: 0 }
      const forkAtHigherNonce = { ...createSafe({ version: '1.3.0', implementation: { value: UNOFFICIAL } }), nonce: 5 }

      expect(isUnsupportedMastercopyMigratable(forkAtNonceZero)).toBe(false)
      expect(isUnsupportedMastercopyMigratable(forkAtNonceZero, { bytecodeResult: { isMatch: false } })).toBe(false)
      expect(isUnsupportedMastercopyMigratable(forkAtHigherNonce)).toBe(false)
      expect(isUnsupportedMastercopyMigratable(forkAtHigherNonce, { bytecodeResult: { isMatch: false } })).toBe(false)
    })

    it('returns false for versions the migration contract does not support', () => {
      expect(
        isUnsupportedMastercopyMigratable(createSafe({ version: '1.1.1', implementation: { value: OFFICIAL_L1_130 } })),
      ).toBe(false)
      expect(
        isUnsupportedMastercopyMigratable(createSafe({ version: '1.2.0', implementation: { value: OFFICIAL_L1_130 } })),
      ).toBe(false)
      expect(
        isUnsupportedMastercopyMigratable(createSafe({ version: '1.0.0', implementation: { value: OFFICIAL_L1_130 } })),
      ).toBe(false)
    })

    it('returns false when there is no usable implementation address', () => {
      expect(isUnsupportedMastercopyMigratable(createSafe({ version: '1.3.0', implementation: { value: '' } }))).toBe(
        false,
      )
    })

    it('returns false when the migration contract is not deployed on the chain', () => {
      jest.mocked(safeDeployments.getSafeMigrationDeployments).mockReturnValueOnce(undefined)
      const safe = createSafe({ version: '1.3.0', implementation: { value: OFFICIAL_L1_130 } })
      expect(isUnsupportedMastercopyMigratable(safe)).toBe(false)
    })
  })

  describe('getMastercopyAction', () => {
    it("returns 'none' for an UP_TO_DATE Safe", () => {
      const safe = createSafe({ implementationVersionState: ImplementationVersionState.UP_TO_DATE, version: '1.4.1' })
      expect(getMastercopyAction(safe)).toBe('none')
    })

    it("returns 'update' for an OUTDATED Safe", () => {
      const safe = createSafe({ implementationVersionState: ImplementationVersionState.OUTDATED, version: '1.1.1' })
      expect(getMastercopyAction(safe)).toBe('update')
    })

    it("returns 'migrate' for an UNKNOWN Safe on an official singleton address", () => {
      const safe = createSafe({ version: '1.3.0', implementation: { value: OFFICIAL_L1_130 } })
      expect(getMastercopyAction(safe)).toBe('migrate')
    })

    it("returns 'migrate' for an UNKNOWN Safe when the bytecode matches an official L2 singleton", () => {
      const safe = createSafe({ version: '1.3.0', implementation: { value: UNOFFICIAL } })
      expect(getMastercopyAction(safe, { bytecodeResult: { isMatch: true, matchedVersion: '1.3.0' } })).toBe('migrate')
    })

    it("returns 'cli' for an UNKNOWN third-party fork (unofficial address, no bytecode match)", () => {
      const safe = createSafe({ version: '1.3.0', implementation: { value: UNOFFICIAL } })
      expect(getMastercopyAction(safe)).toBe('cli')
      expect(getMastercopyAction(safe, { bytecodeResult: { isMatch: false } })).toBe('cli')
    })

    it("returns 'cli' for an UNKNOWN Safe on a version the migration contract does not support", () => {
      const safe = createSafe({ version: '1.1.1', implementation: { value: OFFICIAL_L1_130 } })
      expect(getMastercopyAction(safe)).toBe('cli')
    })
  })

  describe('migration eligibility spec', () => {
    const OFFICIAL_L1_150 = '0xFf51A5898e281Db6DfC7855790607438dF2ca44b'
    const RECOMMENDED_141 = '1.4.1'

    it('official L1 singleton on an L2 chain → migrate (WA-1685)', () => {
      const safe = createSafe({ chainId: '10', version: '1.3.0', implementation: { value: OFFICIAL_L1_130 } })
      expect(getMastercopyAction(safe, { recommendedVersion: RECOMMENDED_141 })).toBe('migrate')
    })

    it('byte-identical redeploy at an unofficial address → migrate (opBNB)', () => {
      const safe = createSafe({ version: '1.3.0', implementation: { value: UNOFFICIAL } })
      expect(
        getMastercopyAction(safe, {
          recommendedVersion: RECOMMENDED_141,
          bytecodeResult: { isMatch: true, matchedVersion: '1.3.0' },
        }),
      ).toBe('migrate')
    })

    it('fork reporting a supported version → cli, at nonce 0 and >0 (WA-2906)', () => {
      const forkAtNonceZero = { ...createSafe({ version: '1.3.0', implementation: { value: UNOFFICIAL } }), nonce: 0 }
      const forkAtHigherNonce = { ...createSafe({ version: '1.3.0', implementation: { value: UNOFFICIAL } }), nonce: 5 }
      expect(getMastercopyAction(forkAtNonceZero, { recommendedVersion: RECOMMENDED_141 })).toBe('cli')
      expect(getMastercopyAction(forkAtHigherNonce, { recommendedVersion: RECOMMENDED_141 })).toBe('cli')
    })

    it('1.5.0 Safe while recommended is 1.4.1 → not offered (no downgrade)', () => {
      const safe = createSafe({ version: '1.5.0', implementation: { value: OFFICIAL_L1_150 } })
      expect(getMastercopyAction(safe, { recommendedVersion: '1.4.1' })).toBe('cli')
    })

    it('legacy 1.1.1 → cli', () => {
      const safe = createSafe({ version: '1.1.1', implementation: { value: OFFICIAL_L1_130 } })
      expect(getMastercopyAction(safe, { recommendedVersion: RECOMMENDED_141 })).toBe('cli')
    })

    it('recommended = 1.5.0 → an official 1.4.1 Safe is offered migrate (range extends with config)', () => {
      const safe = createSafe({ version: '1.4.1', implementation: { value: OFFICIAL_L1_141 } })
      expect(getMastercopyAction(safe, { recommendedVersion: '1.5.0' })).toBe('migrate')
    })
  })
})
