import { Interface } from 'ethers/lib/utils'
import { getMultiSendCallOnlyDeployment, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { SENTINEL_ADDRESS } from '@safe-global/safe-core-sdk/dist/src/utils/constants'
import { encodeMultiSendData } from '@safe-global/safe-core-sdk/dist/src/utils/transactions/utils'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { sameAddress } from '@/utils/addresses'
import { getModuleInstance, KnownContracts } from '@gnosis.pm/zodiac'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import type { AddressEx, SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { RecoveryQueueItem } from '@/components/recovery/RecoveryContext'
import type { JsonRpcProvider } from '@ethersproject/providers'

export function getRecoveryProposalTransactions({
  safe,
  newThreshold,
  newOwners,
}: {
  safe: SafeInfo
  newThreshold: number
  newOwners: Array<AddressEx>
}): Array<MetaTransactionData> {
  const safeDeployment = getSafeSingletonDeployment({ network: safe.chainId, version: safe.version ?? undefined })

  if (!safeDeployment) {
    throw new Error('Safe deployment not found')
  }

  const safeInterface = new Interface(safeDeployment.abi)

  // Cache owner changes to determine prevOwner
  let _owners = safe.owners.map((owner) => owner.value)

  // Don't add/remove same owners
  const ownersToAdd = newOwners
    .filter((newOwner) => !_owners.some((oldOwner) => sameAddress(oldOwner, newOwner.value)))
    .map((owner) => owner.value)
  const ownersToRemove = _owners.filter(
    (oldOwner) => !newOwners.some((newOwner) => sameAddress(newOwner.value, oldOwner)),
  )

  // Check whether threshold should be changed after owner management
  let changeThreshold = newThreshold !== safe.threshold

  // Owner management transaction data
  const txData: Array<string> = []

  // Iterate of existing/new owners and swap, add, remove accordingly
  for (let index = 0; index < Math.max(ownersToAdd.length, ownersToRemove.length); index++) {
    const ownerToAdd = ownersToAdd[index]
    const ownerToRemove = ownersToRemove[index]

    const prevOwner = (() => {
      const ownerIndex = _owners.findIndex((owner) => sameAddress(owner, ownerToRemove))
      return ownerIndex === 0 ? SENTINEL_ADDRESS : _owners[ownerIndex - 1]
    })()

    // Swap existing owner with new one
    if (ownerToRemove && ownerToAdd) {
      const swapOwner = safeInterface.encodeFunctionData('swapOwner', [prevOwner, ownerToRemove, ownerToAdd])
      txData.push(swapOwner)

      // Swap owner in cache
      _owners = _owners.map((owner) => (sameAddress(owner, ownerToRemove) ? ownersToAdd[index] : owner))
    }
    // Add new owner and set threshold
    else if (ownerToAdd) {
      const threshold = Math.min(newThreshold, _owners.length + 1)

      const addOwnerWithThreshold = safeInterface.encodeFunctionData('addOwnerWithThreshold', [ownerToAdd, threshold])
      txData.push(addOwnerWithThreshold)

      changeThreshold = false

      // Add owner to cache
      _owners.push(ownerToAdd)
    }
    // Remove existing owner and set threshold
    else if (ownerToRemove) {
      const threshold = Math.min(newThreshold, _owners.length - 1)

      const removeOwner = safeInterface.encodeFunctionData('removeOwner', [prevOwner, ownerToRemove, threshold])
      txData.push(removeOwner)

      changeThreshold = false

      // Remove owner from cache
      _owners = _owners.filter((owner) => !sameAddress(owner, ownerToRemove))
    }
  }

  // Only swapOwner will be called
  if (changeThreshold) {
    txData.push(safeInterface.encodeFunctionData('changeThreshold', [newThreshold]))
  }

  if (newThreshold > _owners.length) {
    throw new Error('New threshold is higher than desired owners')
  }

  return txData.map((data) => ({
    to: safe.address.value,
    value: '0',
    operation: OperationType.Call,
    data,
  }))
}

export function getRecoveryProposalTransaction({
  safe,
  newThreshold,
  newOwners,
}: {
  safe: SafeInfo
  newThreshold: number
  newOwners: Array<AddressEx>
}): MetaTransactionData {
  const transactions = getRecoveryProposalTransactions({ safe, newThreshold, newOwners })

  if (transactions.length === 0) {
    throw new Error('No recovery transactions found')
  }

  if (transactions.length === 1) {
    return transactions[0]
  }

  const multiSendDeployment = getMultiSendCallOnlyDeployment({
    network: safe.chainId,
    version: safe.version ?? undefined,
  })

  if (!multiSendDeployment) {
    throw new Error('MultiSend deployment not found')
  }

  const multiSendInterface = new Interface(multiSendDeployment.abi)
  const multiSendData = encodeMultiSendData(transactions)

  return {
    to: multiSendDeployment.networkAddresses[safe.chainId] ?? multiSendDeployment.defaultAddress,
    value: '0',
    operation: OperationType.Call,
    data: multiSendInterface.encodeFunctionData('multiSend', [multiSendData]),
  }
}

export function getRecoverySkipTransaction(
  recovery: RecoveryQueueItem,
  provider: JsonRpcProvider,
): MetaTransactionData {
  const delayModifier = getModuleInstance(KnownContracts.DELAY, recovery.address, provider)

  const newTxNonce = recovery.args.queueNonce.add(1)

  return {
    to: delayModifier.address,
    value: '0',
    operation: OperationType.Call,
    data: delayModifier.interface.encodeFunctionData('setTxNonce', [newTxNonce]),
  }
}
