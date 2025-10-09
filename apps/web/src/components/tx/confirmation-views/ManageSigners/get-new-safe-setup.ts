import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import type { TransactionInfo, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

import { isMultiSendTxInfo } from '@/utils/transaction-guards'

const safeInterface = Safe__factory.createInterface()

export function getNewSafeSetup({
  txInfo,
  txData,
  safe,
  signerNames = {},
}: {
  txInfo: TransactionInfo
  txData: TransactionDetails['txData']
  safe: ExtendedSafeInfo
  signerNames?: Record<string, string>
}): {
  newOwners: Array<AddressInfo>
  newThreshold: number
} {
  let ownerAddresses = safe.owners.map((owner) => checksumAddress(owner.value))
  let newThreshold = safe.threshold

  for (const data of _getTransactionsData(txInfo, txData)) {
    const decodedData = safeInterface.parseTransaction({ data })

    if (!decodedData) {
      continue
    }

    switch (decodedData.name) {
      case 'addOwnerWithThreshold': {
        const [ownerToAdd, thresholdToSet] = decodedData.args
        ownerAddresses = [...ownerAddresses, checksumAddress(ownerToAdd)]
        newThreshold = Number(thresholdToSet)
        break
      }
      case 'removeOwner': {
        const [, ownerToRemove, thresholdToSet] = decodedData.args
        ownerAddresses = ownerAddresses.filter((owner) => !sameAddress(owner, ownerToRemove))
        newThreshold = Number(thresholdToSet)
        break
      }
      case 'swapOwner': {
        const [, ownerToRemove, ownerToAdd] = decodedData.args
        ownerAddresses = ownerAddresses.map((owner) =>
          sameAddress(owner, ownerToRemove) ? checksumAddress(ownerToAdd) : owner,
        )
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

  const newOwners: Array<AddressInfo> = ownerAddresses.map((address) => ({
    value: address,
    name: signerNames[address] || undefined,
  }))

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
