import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { type GetContractProps } from '@safe-global/protocol-kit'
import type { SafeVersion } from '@safe-global/types-kit'
import semverSatisfies from 'semver/functions/satisfies'
import { assertValidSafeVersion } from '@safe-global/utils/services/contracts/utils'
import { getSafeMigrationDeployments } from '@safe-global/safe-deployments'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import {
  getChainAgnosticAddress,
  getDeploymentTypeForMasterCopy,
  isEraVmChain,
  isOfficialMasterCopy,
} from '@safe-global/utils/services/contracts/deployments'
import { isSupportedMigrationVersion, type BytecodeComparisonResult } from './bytecodeComparison'

// `UNKNOWN` is returned if the mastercopy does not match supported ones
// @see https://github.com/safe-global/safe-client-gateway/blob/main/src/routes/safes/handlers/safes.rs#L28-L31
//      https://github.com/safe-global/safe-client-gateway/blob/main/src/routes/safes/converters.rs#L77-L79
export const isValidMasterCopy = (implementationVersionState: SafeState['implementationVersionState']): boolean => {
  return implementationVersionState !== 'UNKNOWN'
}

export type MastercopyMigrationOptions = {
  bytecodeResult?: BytecodeComparisonResult
  recommendedVersion?: string
}

type MastercopySafe = Pick<SafeState, 'implementationVersionState' | 'version' | 'chainId' | 'implementation'>

/**
 * An in-place upgrade/migration delegatecalls a singleton of the SAME VM stack — an
 * EraVM (zkSync) proxy can only delegatecall an EraVM singleton, an EVM proxy an EVM
 * one. So a zkSync EraVM Safe cannot move to an EVM-only version (e.g. 1.5.0, which
 * ships `canonical` only): its only path is a fresh EVM Safe + asset transfer. Returns
 * false only for that stranded case — EVM Safes always have a canonical target.
 */
export const canUpgradeInPlace = (safe: MastercopySafe, targetVersion: string): boolean => {
  // Only zkSync EraVM Safes can be stranded. The master-copy flavour decides: canonical
  // and eip155 are both EVM bytecode, only the zksync variant is EraVM. Unrecognised
  // implementations on an EraVM chain conservatively default to EraVM.
  const isEraVmSafe =
    isEraVmChain(safe.chainId, safe.version) &&
    getDeploymentTypeForMasterCopy(safe.implementation?.value, safe.version ?? '', {
      deploymentType: 'zksync',
      isL1: false,
    }).deploymentType === 'zksync'

  // EVM Safes always have a canonical target; an EraVM Safe needs an EraVM singleton
  // at the target version too (1.5.0 ships EVM-only, so there is none).
  if (!isEraVmSafe) return true
  return isEraVmChain(safe.chainId, targetVersion)
}

/**
 * Whether an unrecognized (UNKNOWN) master copy is provably an official Safe singleton —
 * by bytecode match or by living at an official deployment address — and reports a
 * non-legacy version within the migratable range. Trust only; VM-stack reachability and
 * migration-contract availability are gated separately.
 */
const isProvablyOfficialUnsupported = (
  safe: MastercopySafe,
  opts: MastercopyMigrationOptions | undefined,
  targetVersion: string,
): boolean => {
  if (isValidMasterCopy(safe.implementationVersionState)) return false
  if (!safe.version) return false
  if (!isSupportedMigrationVersion(safe.version, targetVersion)) return false
  return Boolean(opts?.bytecodeResult?.isMatch) || isOfficialMasterCopy(safe.implementation?.value, safe.version)
}

export const isUnsupportedMastercopyMigratable = (safe: MastercopySafe, opts?: MastercopyMigrationOptions): boolean => {
  const targetVersion = opts?.recommendedVersion ?? LATEST_SAFE_VERSION

  if (!isProvablyOfficialUnsupported(safe, opts, targetVersion)) return false
  if (!canUpgradeInPlace(safe, targetVersion)) return false

  return Boolean(getChainAgnosticAddress(getSafeMigrationDeployments({ version: targetVersion }), safe.chainId))
}

export type MastercopyAction = 'none' | 'update' | 'migrate' | 'cli' | 'redeploy'

export const getMastercopyAction = (safe: MastercopySafe, opts?: MastercopyMigrationOptions): MastercopyAction => {
  const targetVersion = opts?.recommendedVersion ?? LATEST_SAFE_VERSION

  if (isValidMasterCopy(safe.implementationVersionState)) {
    if (safe.implementationVersionState !== 'OUTDATED') return 'none'
    // CGW flags OUTDATED against the raw config recommendation, while our target is capped
    // at the latest version deployed on the chain. When the cap pulls the target back to
    // the current version there is nothing to offer.
    const [currentVersion] = (safe.version ?? '').split('+')
    if (currentVersion && semverSatisfies(currentVersion, `>=${targetVersion}`)) return 'none'
    // Recognized but outdated: normally an in-place update; a stranded EraVM Safe must redeploy.
    return canUpgradeInPlace(safe, targetVersion) ? 'update' : 'redeploy'
  }

  // Unknown master copy.
  if (isUnsupportedMastercopyMigratable(safe, opts)) return 'migrate'
  if (isProvablyOfficialUnsupported(safe, opts, targetVersion) && !canUpgradeInPlace(safe, targetVersion)) {
    return 'redeploy'
  }
  return 'cli'
}

export const _getValidatedGetContractProps = (
  safeVersion: SafeState['version'],
): Pick<GetContractProps, 'safeVersion'> => {
  assertValidSafeVersion(safeVersion)

  // SDK request here: https://github.com/safe-global/safe-core-sdk/issues/261
  // Remove '+L2'/'+Circles' metadata from version
  const [noMetadataVersion] = safeVersion.split('+')

  return {
    safeVersion: noMetadataVersion as SafeVersion,
  }
}
