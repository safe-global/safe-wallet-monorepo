import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Safe_migration__factory } from '@safe-global/utils/types/contracts'
import { getCompatibilityFallbackHandlerDeployments, getSafeMigrationDeployments } from '@safe-global/safe-deployments'
import {
  getChainAgnosticAddress,
  getDeploymentTypeForMasterCopy,
  hasMatchingDeployment,
  type DeploymentType,
} from '@safe-global/utils/services/contracts/deployments'
import { type MetaTransactionData, OperationType, type SafeVersion } from '@safe-global/types-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { SAFE_VERSIONS } from '@safe-global/utils/services/contracts/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const MIGRATION_METHODS = [
  'migrateSingleton',
  'migrateL2Singleton',
  'migrateWithFallbackHandler',
  'migrateL2WithFallbackHandler',
] as const

type MigrationMethod = (typeof MIGRATION_METHODS)[number]

/**
 * Resolves the SafeMigration contract address for the chain and master copy.
 *
 * The SafeMigration contract ships a `canonical` (EVM) and a `zksync` (EraVM)
 * variant. A proxy can only delegatecall a variant matching its own VM, so the
 * target must follow the master copy's flavour — never the canonical
 * `defaultAddress`. Flavour resolution mirrors `initSafeSDK`: match the master
 * copy against the official singletons, falling back to the chain's `zk` flag.
 */
const getMigrationAddress = (chain: Chain, safeVersion: SafeState['version'], implementation?: string): string => {
  const fallbackType: DeploymentType = chain.zk ? 'zksync' : 'canonical'
  const deploymentType: DeploymentType =
    implementation && safeVersion
      ? getDeploymentTypeForMasterCopy(implementation, safeVersion, { deploymentType: fallbackType, isL1: !chain.l2 })
          .deploymentType
      : fallbackType

  // SafeMigration ships only canonical + zksync variants (no eip155). eip155 and
  // canonical are the same bytecode and are delegatecall-compatible, so an eip155
  // master copy migrates via the canonical SafeMigration address.
  const migrationDeploymentType: DeploymentType = deploymentType === 'eip155' ? 'canonical' : deploymentType

  const address = getChainAgnosticAddress(
    getSafeMigrationDeployments({ version: getLatestSafeVersion(chain) }),
    chain.chainId,
    migrationDeploymentType,
  )

  if (!address) {
    throw new Error('Migration deployment not found')
  }

  return address
}

/**
 * Builds a DelegateCall to the SafeMigration contract that migrates an eligible Safe
 * to the chain's recommended official singleton (L1, L2 or zkEVM). The migrate method
 * is chosen by chain flavour (L1 vs L2) and whether the current fallback handler should
 * be preserved; the target address matches the Safe's VM flavour.
 */
export const createUpdateMigration = (
  chain: Chain,
  safeVersion: SafeState['version'],
  fallbackHandler?: string,
  implementation?: string,
): MetaTransactionData => {
  const to = getMigrationAddress(chain, safeVersion, implementation)

  // Keep fallback handler if it's not a default one
  const keepFallbackHandler =
    !!fallbackHandler &&
    !!safeVersion &&
    !hasMatchingDeployment(getCompatibilityFallbackHandlerDeployments, fallbackHandler, chain.chainId, [
      safeVersion as SafeVersion,
    ])

  const method: MigrationMethod = keepFallbackHandler
    ? chain.l2
      ? 'migrateL2Singleton'
      : 'migrateSingleton'
    : chain.l2
      ? 'migrateL2WithFallbackHandler'
      : 'migrateWithFallbackHandler'

  const interfce = Safe_migration__factory.createInterface()

  return {
    operation: OperationType.DelegateCall, // delegate call required
    data: interfce.encodeFunctionData(method as 'migrateSingleton'), // appease typescript overloads
    to,
    value: '0',
  }
}

/**
 * Detects a DelegateCall to the SafeMigration contract, regardless of which
 * migrate method (L1/L2, with/without fallback handler) or which variant
 * (canonical / zksync) address it targets. Used to avoid flagging the migration
 * tx itself as an unsupported-contract interaction.
 */
export const isSafeMigrationCall = (txData: TransactionData): boolean => {
  const { hexData } = txData
  if (hexData == null) {
    return false
  }

  const migrationAddresses = SAFE_VERSIONS.flatMap((version) =>
    Object.values(getSafeMigrationDeployments({ version })?.deployments ?? {}).map((variant) => variant?.address),
  )
  if (!migrationAddresses.some((address) => sameAddress(txData.to.value, address))) {
    return false
  }

  const safeMigrationInterface = Safe_migration__factory.createInterface()
  return MIGRATION_METHODS.some((method) => hexData.startsWith(safeMigrationInterface.getFunction(method).selector))
}
