import { Safe_migration__factory } from '@/types/contracts'
import { getCompatibilityFallbackHandlerDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment } from '@/services/contracts/deployments'

import { getSafeMigrationDeployment } from '@safe-global/safe-deployments'
import { type MetaTransactionData, OperationType, type SafeVersion } from '@safe-global/safe-core-sdk-types'
import type { ChainInfo, TransactionData } from '@safe-global/safe-gateway-typescript-sdk'

import { LATEST_SAFE_VERSION } from '@/config/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export const SAFE_TO_L2_MIGRATION_VERSION = '1.4.1'

export const createUpdateMigration = (
  chain: ChainInfo,
  safeVersion: string,
  fallbackHandler?: string,
): MetaTransactionData => {
  const deployment = getSafeMigrationDeployment({
    version: chain.recommendedMasterCopyVersion || LATEST_SAFE_VERSION,
    released: true,
    network: chain.chainId,
  })

  if (!deployment) {
    throw new Error('Migration deployment not found')
  }

  // Keep fallback handler if it's not a default one
  const keepFallbackHandler =
    !!fallbackHandler &&
    !hasMatchingDeployment(getCompatibilityFallbackHandlerDeployments, fallbackHandler, chain.chainId, [
      safeVersion as SafeVersion,
    ])

  const method = (
    keepFallbackHandler
      ? chain.l2
        ? 'migrateL2Singleton'
        : 'migrateSingleton'
      : chain.l2
        ? 'migrateL2WithFallbackHandler'
        : 'migrateWithFallbackHandler'
  ) as 'migrateSingleton' // apease typescript

  const interfce = Safe_migration__factory.createInterface()

  const tx: MetaTransactionData = {
    operation: OperationType.DelegateCall, // delegate call required
    data: interfce.encodeFunctionData(method),
    to: deployment.defaultAddress,
    value: '0',
  }

  return tx
}

export const createMigrateToL2 = (chain: ChainInfo) => {
  const deployment = getSafeMigrationDeployment({
    version: SAFE_TO_L2_MIGRATION_VERSION, // This is the only version that has this contract deployed
    released: true,
    network: chain.chainId,
  })

  if (!deployment) {
    throw new Error('Migration deployment not found')
  }

  const interfce = Safe_migration__factory.createInterface()

  const tx: MetaTransactionData = {
    operation: OperationType.DelegateCall, // delegate call required
    data: interfce.encodeFunctionData('migrateL2Singleton'),
    to: deployment.defaultAddress,
    value: '0',
  }

  return tx
}

export const isMigrateL2SingletonCall = (txData: TransactionData): boolean => {
  // We always use the 1.4.1 version for this contract as it is only deployed for 1.4.1 Safes
  const safeMigrationDeployment = getSafeMigrationDeployment({ version: SAFE_TO_L2_MIGRATION_VERSION })
  const safeMigrationAddress = safeMigrationDeployment?.defaultAddress
  const safeMigrationInterface = Safe_migration__factory.createInterface()

  return (
    txData.hexData !== undefined &&
    txData.hexData !== null &&
    txData.hexData.startsWith(safeMigrationInterface.getFunction('migrateL2Singleton').selector) &&
    sameAddress(txData.to.value, safeMigrationAddress)
  )
}
