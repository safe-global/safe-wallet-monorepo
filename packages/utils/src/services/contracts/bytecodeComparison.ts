import { getSafeL2SingletonDeployments, getSafeSingletonDeployments } from '@safe-global/safe-deployments'
import type { SafeVersion } from '@safe-global/types-kit'
import { keccak256 } from 'ethers'
import semverSatisfies from 'semver/functions/satisfies'
import { SAFE_VERSIONS, isLegacyVersion } from './utils'

export type BytecodeComparisonResult = {
  isMatch: boolean
  matchedVersion?: SafeVersion
}

const migratableSourceVersions = (recommendedVersion: string): SafeVersion[] =>
  SAFE_VERSIONS.filter((version) => !isLegacyVersion(version) && semverSatisfies(version, `<=${recommendedVersion}`))

export const isSupportedMigrationVersion = (version: string, recommendedVersion: string): boolean => {
  const [baseVersion] = version.split('+')
  return !isLegacyVersion(baseVersion) && semverSatisfies(baseVersion, `<=${recommendedVersion}`)
}

export const compareWithOfficialSingletons = async (
  implementationBytecode: string,
  recommendedVersion: string,
): Promise<BytecodeComparisonResult> => {
  const bytecodeHash = keccak256(implementationBytecode)

  for (const version of migratableSourceVersions(recommendedVersion)) {
    const deployments = [getSafeSingletonDeployments({ version }), getSafeL2SingletonDeployments({ version })]

    for (const deployment of deployments) {
      if (!deployment) {
        continue
      }

      const variants = Object.values(deployment.deployments)
      if (variants.some((variant) => variant.codeHash === bytecodeHash)) {
        return {
          isMatch: true,
          matchedVersion: version,
        }
      }
    }
  }

  return {
    isMatch: false,
  }
}
