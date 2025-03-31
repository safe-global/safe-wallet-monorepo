import { sameAddress } from '@safe-global/utils/utils/addresses'
import {
  isSwapOwnerCalldata,
  isAddOwnerWithThresholdCalldata,
  isRemoveOwnerCalldata,
  isChangeThresholdCalldata,
  isMultiSendCalldata,
} from '@/utils/transaction-calldata'
import { getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { Interface } from 'ethers'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'

function decodeOwnerManagementTransaction(safe: SafeInfo, transaction: BaseTransaction): SafeInfo {
  const safeDeployment = getSafeSingletonDeployment({ network: safe.chainId, version: safe.version ?? undefined })

  if (!safeDeployment) {
    throw new Error('No Safe deployment found')
  }

  const safeInterface = new Interface(safeDeployment.abi)

  let _owners = safe.owners
  let _threshold = safe.threshold

  if (isSwapOwnerCalldata(transaction.data)) {
    const [, ownerToRemove, ownerToAdd] = safeInterface.decodeFunctionData('swapOwner', transaction.data)

    _owners = safe.owners.map((owner) => (sameAddress(owner.value, ownerToRemove) ? { value: ownerToAdd } : owner))
  } else if (isAddOwnerWithThresholdCalldata(transaction.data)) {
    const [ownerToAdd, newThreshold] = safeInterface.decodeFunctionData('addOwnerWithThreshold', transaction.data)

    _owners = _owners.concat({ value: ownerToAdd })
    _threshold = Number(newThreshold)
  } else if (isRemoveOwnerCalldata(transaction.data)) {
    const [, ownerToRemove, newThreshold] = safeInterface.decodeFunctionData('removeOwner', transaction.data)

    _owners = safe.owners.filter((owner) => !sameAddress(owner.value, ownerToRemove))
    _threshold = Number(newThreshold)
  } else if (isChangeThresholdCalldata(transaction.data)) {
    const [newThreshold] = safeInterface.decodeFunctionData('changeThreshold', transaction.data)

    _threshold = Number(newThreshold)
  } else {
    throw new Error('Unexpected transaction')
  }

  return {
    ...safe,
    owners: _owners,
    threshold: _threshold,
  }
}

export function getRecoveredSafeInfo(safe: SafeInfo, transaction: BaseTransaction): SafeInfo {
  const transactions = isMultiSendCalldata(transaction.data) ? decodeMultiSendData(transaction.data) : [transaction]

  return transactions.reduce((acc, cur) => {
    return decodeOwnerManagementTransaction(acc, cur)
  }, safe)
}
