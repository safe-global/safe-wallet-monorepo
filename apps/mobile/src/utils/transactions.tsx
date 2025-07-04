import { GroupedTxs } from '@/src/features/TxHistory/utils'
import {
  isTransferTxInfo,
  isAddSignerTxInfo,
  isMultiSendTxInfo,
  isCustomTxInfo,
  isERC721Transfer,
  isRemoveSignerTxInfo,
  isOrderTxInfo,
  isVaultDepositTxInfo,
  isVaultRedeemTxInfo,
  isStakingTxDepositInfo,
} from '@/src/utils/transaction-guards'
import { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ETxType } from '../types/txType'

export const getTransactionType = ({ txInfo }: { txInfo: Transaction['txInfo'] }) => {
  if (isTransferTxInfo(txInfo)) {
    return ETxType.TOKEN_TRANSFER
  }

  if (isTransferTxInfo(txInfo) && isERC721Transfer(txInfo)) {
    return ETxType.NFT_TRANSFER
  }

  if (isAddSignerTxInfo(txInfo)) {
    return ETxType.ADD_SIGNER
  }

  if (isRemoveSignerTxInfo(txInfo)) {
    return ETxType.REMOVE_SIGNER
  }

  if (isMultiSendTxInfo(txInfo) || isCustomTxInfo(txInfo)) {
    return ETxType.CONTRACT_INTERACTION
  }

  if (isOrderTxInfo(txInfo)) {
    return ETxType.SWAP_ORDER
  }

  if (isStakingTxDepositInfo(txInfo)) {
    return ETxType.STAKE_DEPOSIT
  }

  if (isVaultDepositTxInfo(txInfo)) {
    return ETxType.VAULT_DEPOSIT
  }

  if (isVaultRedeemTxInfo(txInfo)) {
    return ETxType.VAULT_REDEEM
  }

  return null
}

export const groupBulkTxs = <T extends { type: string; transaction?: Transaction }>(
  list: GroupedTxs<T>,
): GroupedTxs<T> => {
  const grouped = list
    .reduce<GroupedTxs<T>>((resultItems, item) => {
      if (Array.isArray(item) || item.type !== 'TRANSACTION') {
        return resultItems.concat([item])
      }
      const currentTxHash = item.transaction?.txHash

      const prevItem = resultItems[resultItems.length - 1]
      if (!Array.isArray(prevItem)) {
        return resultItems.concat([[item]])
      }
      const prevTxHash = prevItem[0]?.transaction?.txHash

      if (currentTxHash && currentTxHash === prevTxHash) {
        prevItem.push(item)
        return resultItems
      }

      return resultItems.concat([[item]])
    }, [])
    .map((item) => (Array.isArray(item) && item.length === 1 ? item[0] : item))

  return grouped
}
