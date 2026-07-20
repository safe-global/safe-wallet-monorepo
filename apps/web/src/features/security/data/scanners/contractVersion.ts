import semverLt from 'semver/functions/lt'
import semverValid from 'semver/functions/valid'
import { isValidMasterCopy, isMigrationToL2Possible } from '@safe-global/utils/services/contracts/safeContracts'
import { getSafeSingletonDeployments, getSafeL2SingletonDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SecurityScanner } from './types'
import { KNOWN_SAFE_VERSIONS, getSeverityFromScore } from './constants'

const isKnownImplementation = (address: string, chainId: string): boolean =>
  hasMatchingDeployment(getSafeSingletonDeployments, address, chainId, KNOWN_SAFE_VERSIONS) ||
  hasMatchingDeployment(getSafeL2SingletonDeployments, address, chainId, KNOWN_SAFE_VERSIONS)

type VersionComparison = 'older' | 'not-older' | 'unknown'

/**
 * Compares a Safe's version against the chain's latest recommended version.
 * Both inputs may carry semver build metadata such as `+L2` or `+Circles`;
 * semver comparison ignores that metadata, so `1.3.0+L2 < 1.4.1` is true and
 * `1.4.1+L2 < 1.4.1` is false.
 *
 * Returns `'unknown'` when either version is missing or not valid semver — in
 * that case the caller should defer to the gateway's `implementationVersionState`
 * flag rather than guessing.
 */
const compareVersionToLatest = (version: string | null, latestVersion: string): VersionComparison => {
  if (!version) return 'unknown'
  if (!semverValid(version) || !semverValid(latestVersion)) return 'unknown'
  return semverLt(version, latestVersion) ? 'older' : 'not-older'
}

export const contractVersionScanner: SecurityScanner = {
  id: 'contract_version',
  scan: async (ctx) => {
    const {
      implementationVersionState,
      implementationAddress,
      version,
      latestVersion,
      masterCopyDeployer,
      chainId,
      creationInfo,
    } = ctx
    const now = new Date().toISOString()
    const versionLabel = version ?? 'Unknown'

    // Unsupported mastercopy — same check as UnsupportedMastercopyWarning
    if (!isValidMasterCopy(implementationVersionState)) {
      // isMigrationToL2Possible only reads version and chainId from SafeState.
      // We cast to satisfy the type, but only these 2 fields are accessed.
      const canMigrateL2 = isMigrationToL2Possible({
        version,
        chainId,
      } as Pick<SafeState, 'version' | 'chainId'> as SafeState)

      const score = 10
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Current version', value: versionLabel },
          { label: 'Status', value: 'Unsupported' },
          { label: 'Implementation', value: implementationAddress },
        ],
        remediation: canMigrateL2
          ? 'This version may miss security fixes and improvements. You can migrate it to a compatible version.'
          : 'This version may miss security fixes and improvements. Use the CLI tool to migrate.',
        lastChecked: now,
        ctaLabelOverride: 'Migrate',
      }
    }

    // Outdated — flag any Gnosis-deployed Safe whose version is strictly older than
    // the chain's latest recommended version. Unlike `OutdatedMastercopyWarning` we do
    // NOT short-circuit on `isNonCriticalUpdate` (`>= 1.3.0`): the Security Hub must
    // surface this independently of the dashboard banner, and the comparison must be
    // network-aware so that future bumps (e.g. 1.5.1) automatically downgrade older
    // mastercopies on chains where a newer one is recommended. Semver build metadata
    // (`+L2`, `+Circles`) is intentionally ignored by `<`, so 1.3.0+L2 is treated as
    // 1.3.0 — outdated when latest is 1.4.1, current when latest is 1.3.0.
    //
    // When the version can't be compared (missing or invalid semver) we defer to the
    // gateway's OUTDATED flag rather than silently marking the Safe as up to date.
    const versionComparison = compareVersionToLatest(version, latestVersion)
    if (
      implementationVersionState === 'OUTDATED' &&
      masterCopyDeployer === 'Gnosis' &&
      versionComparison !== 'not-older'
    ) {
      const score = 30
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Current version', value: versionLabel },
          { label: 'Latest version', value: latestVersion },
        ],
        remediation:
          'A newer version is available. Update now to take advantage of new features and the highest security standards.',
        lastChecked: now,
      }
    }

    // Version is current but implementation address is not a recognized Safe deployment
    if (!isKnownImplementation(implementationAddress, chainId)) {
      const score = 30
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Current version', value: versionLabel },
          { label: 'Implementation', value: implementationAddress },
          { label: 'Status', value: 'Unrecognized implementation' },
        ],
        remediation:
          'The implementation contract address does not match any known official Safe deployment. This could indicate a custom or unofficial build.',
        lastChecked: now,
      }
    }

    // Check if original deployment used a recognized implementation
    if (creationInfo?.masterCopy && !isKnownImplementation(creationInfo.masterCopy, chainId)) {
      const score = 60
      return {
        status: 'partial',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Current version', value: versionLabel },
          { label: 'Original implementation', value: creationInfo.masterCopy },
          { label: 'Status', value: 'Deployed with unrecognized implementation' },
        ],
        remediation:
          'This Safe was originally deployed with an unrecognized implementation contract. The current version is up to date, but the deployment origin could not be verified.',
        lastChecked: now,
      }
    }

    const score = 100
    return {
      status: 'clear',
      severity: getSeverityFromScore(score),
      score,
      evidence: [
        { label: 'Current version', value: versionLabel },
        { label: 'Status', value: 'Up to date' },
      ],
      remediation: '',
      lastChecked: now,
    }
  },
}
