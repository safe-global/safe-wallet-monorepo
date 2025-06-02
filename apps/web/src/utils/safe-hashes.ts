import { TypedDataEncoder } from 'ethers'
import semverSatisfies from 'semver/functions/satisfies'
import { getEip712MessageTypes, getEip712TxTypes } from '@safe-global/protocol-kit/dist/src/utils'
import type { SafeTransactionData, SafeVersion } from '@safe-global/types-kit'
import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { generateSafeMessageMessage } from '@safe-global/utils/utils/safe-messages'

const NEW_DOMAIN_TYPE_HASH_VERSION = '>=1.3.0'
const NEW_SAFE_TX_TYPE_HASH_VERSION = '>=1.0.0'

export function getDomainHash({
  chainId,
  safeAddress,
  safeVersion,
}: {
  chainId: string
  safeAddress: string
  safeVersion: SafeVersion
}): string {
  const includeChainId = semverSatisfies(safeVersion, NEW_DOMAIN_TYPE_HASH_VERSION)
  return TypedDataEncoder.hashDomain({
    ...(includeChainId && { chainId }),
    verifyingContract: safeAddress,
  })
}

export function getSafeTxMessageHash({
  safeVersion,
  safeTxData,
}: {
  safeVersion: SafeVersion
  safeTxData: SafeTransactionData
}): string {
  const usesBaseGas = semverSatisfies(safeVersion, NEW_SAFE_TX_TYPE_HASH_VERSION)
  const SafeTx = getEip712TxTypes(safeVersion).SafeTx

  // Clone to not modify the original
  const tx: any = { ...safeTxData }

  if (!usesBaseGas) {
    tx.dataGas = tx.baseGas
    delete tx.baseGas

    SafeTx[5].name = 'dataGas'
  }

  return TypedDataEncoder.hashStruct('SafeTx', { SafeTx }, tx)
}

export function getSafeMessageMessageHash({
  message,
  safeVersion,
}: {
  message: MessageItem['message']
  safeVersion: SafeVersion
}): string {
  const SafeMessage = getEip712MessageTypes(safeVersion).SafeMessage
  return TypedDataEncoder.hashStruct('SafeMessage', { SafeMessage }, { message: generateSafeMessageMessage(message) })
}
