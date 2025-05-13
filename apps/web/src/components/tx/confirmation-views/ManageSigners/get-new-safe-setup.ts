import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import type { TransactionInfo, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'

import { isMultiSendTxInfo } from '@/utils/transaction-guards'

const safeInterface = Safe__factory.createInterface()

export function getNewSafeSetup({
  txInfo,
  txData,
  safe,
}: {
  txInfo: TransactionInfo
  txData: TransactionDetails['txData']
  safe: ExtendedSafeInfo
}): {
  newOwners: Array<string>
  newThreshold: number
} {
  let newOwners = safe.owners.map((owner) => owner.value)
  let newThreshold = safe.threshold

  for (const data of _getTransactionsData(txInfo, txData)) {
    const decodedData = safeInterface.parseTransaction({ data })

    if (!decodedData) {
      continue
    }

    switch (decodedData.name) {
      case 'addOwnerWithThreshold': {
        const [ownerToAdd, thresholdToSet] = decodedData.args
        newOwners = [...newOwners, checksumAddress(ownerToAdd)]
        newThreshold = Number(thresholdToSet)
        break
      }
      case 'removeOwner': {
        const [, ownerToRemove, thresholdToSet] = decodedData.args
        newOwners = newOwners.filter((owner) => !sameAddress(owner, ownerToRemove))
        newThreshold = Number(thresholdToSet)
        break
      }
      case 'swapOwner': {
        const [, ownerToRemove, ownerToAdd] = decodedData.args
        newOwners = newOwners.map((owner) => (sameAddress(owner, ownerToRemove) ? checksumAddress(ownerToAdd) : owner))
        break
      }
      case 'changeThreshold': {
        const [thresholdToSet] = decodedData.args
        newThreshold = Number(thresholdToSet)
        break
      }
      default: {
        break
      }
    }
  }

  return {
    newOwners,
    newThreshold,
  }
}

export function _getTransactionsData(txInfo: TransactionInfo, txData: TransactionDetails['txData']): Array<string> {
  let transactions: Array<string | null | undefined> | undefined

  if (!isMultiSendTxInfo(txInfo)) {
    transactions = [txData?.hexData]
  } else {
    transactions = txData?.dataDecoded?.parameters?.[0].valueDecoded?.map(({ data }) => data) ?? []
  }

  return transactions.filter((x) => x != null)
}
