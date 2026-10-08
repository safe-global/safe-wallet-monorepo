import { SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import type { AddressInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getOrderClass } from '@/features/swap'
import type { ReactElement } from 'react'
import { useMemo } from 'react'

import {
  isCancellationTxInfo,
  isModuleExecutionInfo,
  isMultiSendTxInfo,
  isNestedConfirmationTxInfo,
  isOutgoingTransfer,
  isTxQueued,
} from '@/utils/transaction-guards'
import useAddressBook from './useAddressBook'
import type { AddressBook } from '@/store/addressBookSlice'
import { TWAP_ORDER_TITLE } from '@/features/swap/constants'
import { txIcon } from '@views/hooks/TxIconView'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleX,
  Code,
  Database,
  GitMerge,
  Layers,
  Repeat,
  SendToBack,
  Settings,
  TrendingUp,
} from 'lucide-react'

const getTxTo = ({ txInfo }: Pick<Transaction, 'txInfo'>): AddressInfo | undefined => {
  switch (txInfo.type) {
    case TransactionInfoType.CREATION: {
      return txInfo.factory
    }
    case TransactionInfoType.TRANSFER: {
      return txInfo.recipient
    }
    case TransactionInfoType.SETTINGS_CHANGE: {
      return undefined
    }
    case TransactionInfoType.CUSTOM: {
      return txInfo.to
    }
  }
}

type TxType = {
  icon: string | ReactElement
  text: string
}

export const getTransactionType = (tx: Transaction, addressBook: AddressBook): TxType => {
  const toAddress = getTxTo(tx)
  const addressBookName = toAddress?.value ? addressBook[toAddress.value] : undefined

  switch (tx.txInfo.type) {
    case TransactionInfoType.CREATION: {
      return {
        icon: toAddress?.logoUri || txIcon(Settings),
        text: 'Safe account created',
      }
    }
    case TransactionInfoType.SWAP_TRANSFER:
    case TransactionInfoType.TRANSFER: {
      const isSendTx = isOutgoingTransfer(tx.txInfo)

      return {
        icon: isSendTx ? txIcon(ArrowUpRight, 'destructive') : txIcon(ArrowDownLeft, 'success'),
        text: isSendTx ? (isTxQueued(tx.txStatus) ? 'Send' : 'Sent') : 'Received',
      }
    }
    case TransactionInfoType.SETTINGS_CHANGE: {
      // deleteGuard doesn't exist in Solidity
      // It is decoded as 'setGuard' with a settingsInfo.type of 'DELETE_GUARD'
      const isDeleteGuard = tx.txInfo.settingsInfo?.type === SettingsInfoType.DELETE_GUARD

      return {
        icon: txIcon(Settings),
        text: isDeleteGuard ? 'deleteGuard' : tx.txInfo.dataDecoded.method,
      }
    }
    case TransactionInfoType.SWAP_ORDER: {
      const orderClass = getOrderClass(tx.txInfo)
      const altText = orderClass === 'limit' ? 'Limit order' : 'Swap order'

      return {
        icon: txIcon(Repeat, 'small'),
        text: altText,
      }
    }
    case TransactionInfoType.TWAP_ORDER: {
      return {
        icon: txIcon(Repeat, 'small'),
        text: TWAP_ORDER_TITLE,
      }
    }
    case TransactionInfoType.NATIVE_STAKING_DEPOSIT: {
      return {
        icon: txIcon(Database),
        text: 'Stake',
      }
    }
    case TransactionInfoType.NATIVE_STAKING_VALIDATORS_EXIT: {
      return {
        icon: txIcon(Database),
        text: 'Withdraw request',
      }
    }
    case TransactionInfoType.NATIVE_STAKING_WITHDRAW: {
      return {
        icon: txIcon(Database),
        text: 'Claim',
      }
    }
    // @ts-ignore TODO: Add types to old SDK or switch to auto-generated
    case 'VaultDeposit': {
      return {
        icon: txIcon(TrendingUp),
        text: 'Deposit',
      }
    }
    // @ts-ignore TODO: Add types to old SDK or switch to auto-generated
    case 'VaultRedeem': {
      return {
        icon: txIcon(TrendingUp),
        text: 'Withdraw',
      }
    }

    // @ts-ignore TODO: Add types to old SDK or switch to auto-generated
    case 'SwapAndBridge': {
      return {
        icon: txIcon(SendToBack),
        text: 'Bridge',
      }
    }

    // @ts-ignore TODO: Add types to old SDK or switch to auto-generated
    case 'Swap': {
      return {
        icon: txIcon(Repeat, 'small'),
        text: 'Swap',
      }
    }

    case TransactionInfoType.CUSTOM: {
      if (tx.safeAppInfo) {
        return {
          icon: tx.safeAppInfo.logoUri || txIcon(Code),
          text: tx.safeAppInfo.name,
        }
      }

      if (isMultiSendTxInfo(tx.txInfo)) {
        return {
          icon: txIcon(Layers),
          text: 'Batch',
        }
      }

      if (isModuleExecutionInfo(tx.executionInfo)) {
        return {
          icon: toAddress?.logoUri || txIcon(Code),
          text: toAddress?.name || 'Contract interaction',
        }
      }

      if (isCancellationTxInfo(tx.txInfo)) {
        return {
          icon: txIcon(CircleX, 'destructive'),
          text: 'On-chain rejection',
        }
      }

      if (isNestedConfirmationTxInfo(tx.txInfo)) {
        return {
          icon: txIcon(GitMerge),
          text: `Nested Safe${addressBookName ? `: ${addressBookName}` : ''}`,
        }
      }

      return {
        icon: toAddress?.logoUri || txIcon(Code),
        text: addressBookName || toAddress?.name || 'Contract interaction',
      }
    }
    default: {
      return {
        icon: txIcon(Code),
        text: addressBookName || 'Contract interaction',
      }
    }
  }
}

export const useTransactionType = (tx: Transaction): TxType => {
  const addressBook = useAddressBook()

  return useMemo(() => {
    return getTransactionType(tx, addressBook)
  }, [tx, addressBook])
}
