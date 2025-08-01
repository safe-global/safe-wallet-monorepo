import type { SafeContractImplementationType } from '@safe-global/protocol-kit/dist/src/types/contracts'
import type { MetaTransactionData, SafeVersion } from '@safe-global/types-kit'
import { OperationType } from '@safe-global/types-kit'
import type { ChainInfo, TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import semverSatisfies from 'semver/functions/satisfies'
import { getReadOnlyFallbackHandlerContract, getReadOnlyGnosisSafeContract } from '@/services/contracts/safeContracts'
import { SAFE_FEATURES } from '@safe-global/protocol-kit/dist/src/utils/safeVersions'
import { hasSafeFeature } from '@/utils/safe-versions'
import { createUpdateMigration } from '@/utils/safe-migrations'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.1.1'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { determineMasterCopyVersion } from '@safe-global/utils/utils/safe'
import { getSafeMigrationDeployment } from '@safe-global/safe-deployments'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { assertValidSafeVersion } from '@safe-global/utils/services/contracts/utils'
import { SAFE_TO_L2_MIGRATION_VERSION } from '@safe-global/utils/config/constants'

const getChangeFallbackHandlerCallData = async (
  safeContractInstance: SafeContractImplementationType,
  chain: ChainInfo,
): Promise<string> => {
  if (!hasSafeFeature(SAFE_FEATURES.SAFE_FALLBACK_HANDLER, getLatestSafeVersion(chain))) {
    return '0x'
  }

  const fallbackHandlerAddress = (await getReadOnlyFallbackHandlerContract(getLatestSafeVersion(chain))).getAddress()
  // @ts-ignore
  return safeContractInstance.encode('setFallbackHandler', [fallbackHandlerAddress])
}

/**
 * For 1.3.0 Safes, does a delegate call to a migration contract.
 *
 * For older Safes, creates two transactions:
 * - change the mastercopy address
 * - set the fallback handler address
 */
export const createUpdateSafeTxs = async (safe: SafeState, chain: ChainInfo): Promise<MetaTransactionData[]> => {
  assertValidSafeVersion(safe.version)

  // 1.3.0 Safes are updated using a delegate call to a migration contract
  if (semverSatisfies(safe.version, '1.3.0')) {
    return [createUpdateMigration(chain, safe.version, safe.fallbackHandler?.value)]
  }

  // For older Safes, we need to create two transactions
  const latestMasterCopyAddress = (await getReadOnlyGnosisSafeContract(chain, getLatestSafeVersion(chain))).getAddress()
  const currentReadOnlySafeContract = await getReadOnlyGnosisSafeContract(chain, safe.version)

  const updatedReadOnlySafeContract = await getReadOnlyGnosisSafeContract(chain, getLatestSafeVersion(chain))

  // @ts-expect-error this was removed in 1.3.0 but we need to support it for older safe versions
  const changeMasterCopyCallData = currentReadOnlySafeContract.encode('changeMasterCopy', [latestMasterCopyAddress])
  const changeFallbackHandlerCallData = await getChangeFallbackHandlerCallData(updatedReadOnlySafeContract, chain)

  const txs: MetaTransactionData[] = [
    {
      to: safe.address.value,
      value: '0',
      data: changeMasterCopyCallData,
      operation: OperationType.Call,
    },
    {
      to: safe.address.value,
      value: '0',
      data: changeFallbackHandlerCallData,
      operation: OperationType.Call,
    },
  ]

  return txs
}
const SAFE_1_1_1_INTERFACE = Gnosis_safe__factory.createInterface()

export const extractTargetVersionFromUpdateSafeTx = (
  txData: TransactionData | undefined,
  safe: SafeState,
): SafeVersion | undefined => {
  if (!txData) {
    return
  }
  const data = txData.hexData ?? '0x'
  let migrationTxData: MetaTransactionData = {
    to: txData.to.value,
    data,
    value: txData.value ?? '0',
    operation: txData.operation as number,
  }
  if (isMultiSendCalldata(data)) {
    // Decode multisend and check the first call
    const txs = decodeMultiSendData(data)
    if (txs.length === 2) {
      // First tx is the upgrade. Second sets the fallback handler
      migrationTxData = txs[0]
    }
  }

  // Below Safe 1.3.0 the call will be to the Safe itself and call changeMasterCopy
  if (
    sameAddress(migrationTxData.to, safe.address.value) &&
    migrationTxData.data.startsWith(SAFE_1_1_1_INTERFACE.getFunction('changeMasterCopy').selector)
  ) {
    // Decode call and check which Safe version it is
    const decodedData = SAFE_1_1_1_INTERFACE.decodeFunctionData('changeMasterCopy', migrationTxData.data)
    return determineMasterCopyVersion(decodedData[0], safe.chainId)
  }

  const safeMigrationAddress = getSafeMigrationDeployment({
    version: SAFE_TO_L2_MIGRATION_VERSION,
    network: safe.chainId,
  })?.networkAddresses[safe.chainId]

  // Otherwise it must be a delegate call to the SafeMigration 1.4.1 contract
  if (migrationTxData.operation === 1 && sameAddress(safeMigrationAddress, migrationTxData.to)) {
    // This contract can only migrate to 1.4.1
    return SAFE_TO_L2_MIGRATION_VERSION
  }
}
