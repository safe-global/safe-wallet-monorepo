import { Interface } from 'ethers'
import { getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getModuleInstance, KnownContracts } from '@gnosis.pm/zodiac'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import type { AddressEx, SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import type { Provider } from 'ethers'

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

  return txData.map((data) => ({
    to: safe.address.value,
    value: '0',
    operation: OperationType.Call,
    data,
  }))
}

export async function getRecoverySkipTransaction(
  recovery: RecoveryQueueItem,
  provider: Provider,
): Promise<MetaTransactionData> {
  const delayModifier = getModuleInstance(KnownContracts.DELAY, recovery.address, provider)

  const newTxNonce = recovery.args.queueNonce + 1n

  return {
    to: await delayModifier.getAddress(),
    value: '0',
    operation: OperationType.Call,
    data: delayModifier.interface.encodeFunctionData('setTxNonce', [newTxNonce]),
  }
}
