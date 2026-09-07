import semverLt from 'semver/functions/lt'
import semverValid from 'semver/functions/valid'
import {
  isUnsupportedMastercopyMigratable,
  isValidMasterCopy,
} from '@safe-global/utils/services/contracts/safeContracts'
import { getSafeSingletonDeployments, getSafeL2SingletonDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
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

    // Unsupported mastercopy — same check as MastercopyWarning (via getMastercopyAction). No bytecode
    // is available here, so this relies on the officiality address fallback.
    if (!isValidMasterCopy(implementationVersionState)) {
      const canMigrateL2 = isUnsupportedMastercopyMigratable(
        {
          implementationVersionState,
          version,
          chainId,
          implementation: { value: implementationAddress },
        },
        { recommendedVersion: latestVersion },
      )

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

    // Flag any Gnosis-deployed Safe older than the chain's latest recommended version. Unlike
    // `MastercopyWarning`, no `isNonCriticalUpdate` short-circuit: the Security Hub surfaces this
    // independently, network-aware (future bumps auto-downgrade older mastercopies), ignoring build
    // metadata (`+L2`/`+Circles`). Uncomparable versions defer to the gateway's OUTDATED flag.
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
