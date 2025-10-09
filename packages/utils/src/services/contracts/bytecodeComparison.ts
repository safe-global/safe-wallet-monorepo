import { getSafeL2SingletonDeployments } from '@safe-global/safe-deployments'
import type { SafeVersion } from '@safe-global/types-kit'
import { keccak256 } from 'ethers'

/**
 * Supported L2 versions for bytecode comparison and migration
 */
const SUPPORTED_L2_VERSIONS: SafeVersion[] = ['1.3.0', '1.4.1']

/**
 * Result of bytecode comparison
 */
export type BytecodeComparisonResult = {
  isMatch: boolean
  matchedVersion?: SafeVersion
}

/**
 * Compares the bytecode of an unsupported implementation with official L2 deployments
 * to determine if it matches a supported contract.
 *
 * @param implementationBytecode - The bytecode of the unsupported implementation
 * @param chainId - The chain ID to check against
 * @returns BytecodeComparisonResult with match status and version if matched
 */
export const compareWithSupportedL2Contracts = async (
  implementationBytecode: string,
  chainId: string,
): Promise<BytecodeComparisonResult> => {
  // Calculate the hash of the unsupported implementation's bytecode
  const bytecodeHash = keccak256(implementationBytecode)

  // Check against supported L2 versions
  for (const version of SUPPORTED_L2_VERSIONS) {
    const deployment = getSafeL2SingletonDeployments({ version })

    if (!deployment) {
      continue
    }

    // Check if the chain has this deployment
    const networkAddresses = deployment.networkAddresses[chainId]
    if (!networkAddresses) {
      continue
    }

    // Compare bytecode hash with all deployment variants (canonical, eip155, zksync)
    const deploymentVariants = Object.values(deployment.deployments)
    for (const variant of deploymentVariants) {
      if (variant.codeHash === bytecodeHash) {
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

/**
 * Checks if a given version is supported for bytecode comparison and migration
 *
 * @param version - The Safe version to check (may include +L2 suffix)
 * @returns boolean indicating if the version is supported
 */
export const isSupportedL2Version = (version: string): version is SafeVersion => {
  // Remove metadata like '+L2' or '+Circles' from version
  const [baseVersion] = version.split('+')
  return SUPPORTED_L2_VERSIONS.includes(baseVersion as SafeVersion)
}
