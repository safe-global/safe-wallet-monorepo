import { useMemo } from 'react'
import type { AnyAppDataDocVersion, latest } from '@cowprotocol/app-data'
import { SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import type { Transaction, AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  isCancellationTxInfo,
  isModuleExecutionInfo,
  isMultiSendTxInfo,
  isOutgoingTransfer,
  isTxQueued,
} from '@/src/utils/transaction-guards'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { SwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

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

interface TxType {
  text: string
  icon?: string | React.ReactElement
  image: string | React.ReactElement
}

export const getOrderClass = (order: Pick<SwapOrderTransactionInfo, 'fullAppData'>): latest.OrderClass1 => {
  const fullAppData = order.fullAppData as AnyAppDataDocVersion
  const orderClass = (fullAppData?.metadata?.orderClass as latest.OrderClass)?.orderClass

  return orderClass || 'market'
}

export const getTransactionType = (tx: Transaction): TxType => {
  const toAddress = getTxTo(tx)

  switch (tx.txInfo.type) {
    case TransactionInfoType.CREATION: {
      return {
        image: toAddress?.logoUri || <SafeFontIcon name={'settings'} />,
        icon: toAddress?.logoUri || <SafeFontIcon name={'settings'} />,
        text: 'Safe Account created',
      }
    }
    case TransactionInfoType.SWAP_TRANSFER:
    case TransactionInfoType.TRANSFER: {
      const isSendTx = isOutgoingTransfer(tx.txInfo)
      const icon = isSendTx ? (
        <SafeFontIcon name={'transaction-outgoing'} />
      ) : (
        <SafeFontIcon name={'transaction-incoming'} />
      )
      return {
        icon,
        image: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
        text: isSendTx ? (isTxQueued(tx.txStatus) ? 'Send' : 'Sent') : 'Received',
      }
    }
    case TransactionInfoType.SETTINGS_CHANGE: {
      // deleteGuard doesn't exist in Solidity
      // It is decoded as 'setGuard' with a settingsInfo.type of 'DELETE_GUARD'
      const isDeleteGuard = tx.txInfo.settingsInfo?.type === SettingsInfoType.DELETE_GUARD

      return {
        image: <SafeFontIcon name={'settings'} />,
        icon: <SafeFontIcon name={'settings'} />,
        text: isDeleteGuard ? 'deleteGuard' : tx.txInfo.dataDecoded.method,
      }
    }

    case TransactionInfoType.SWAP_ORDER: {
      const orderClass = getOrderClass(tx.txInfo)
      const altText = orderClass === 'limit' ? 'Limit order' : 'Swap order'

      return {
        image: <SafeFontIcon name={'transaction-swap'} />,
        icon: <SafeFontIcon name={'transaction-swap'} />,
        text: altText,
      }
    }
    case TransactionInfoType.TWAP_ORDER: {
      return {
        image: <SafeFontIcon name={'transaction-swap'} />,
        icon: <SafeFontIcon name={'transaction-swap'} />,
        text: 'TWAP order',
      }
    }
    case TransactionInfoType.CUSTOM: {
      if (isMultiSendTxInfo(tx.txInfo) && !tx.safeAppInfo) {
        return {
          image: <SafeFontIcon name={'safe'} />,
          icon: <SafeFontIcon name={'transaction-batch'} />,
          text: 'Batch',
        }
      }

      if (isModuleExecutionInfo(tx.executionInfo)) {
        return {
          image: toAddress?.logoUri || <SafeFontIcon name={'transaction-contract'} />,
          icon: <SafeFontIcon name={'transaction-contract'} />,
          text: toAddress?.name || 'Contract interaction',
        }
      }

      if (isCancellationTxInfo(tx.txInfo)) {
        return {
          image: <SafeFontIcon name={'close'} />,
          icon: <SafeFontIcon name={'close'} />,
          text: 'On-chain rejection',
        }
      }

      return {
        image: toAddress?.logoUri || <SafeFontIcon name={'transaction-contract'} />,
        icon: <SafeFontIcon name={'transaction-contract'} />,
        text: toAddress?.name || 'Contract interaction',
      }
    }
    default: {
      if (tx.safeAppInfo) {
        return {
          image: tx.safeAppInfo.logoUri || '',
          icon: <SafeFontIcon name={'safe'} />,
          text: tx.safeAppInfo.name,
        }
      }

      return {
        icon: <SafeFontIcon name={'transaction-contract'} />,
        image: <SafeFontIcon name={'transaction-contract'} />,
        text: 'Contract interaction',
      }
    }
  }
}

// We're going to need the address book in the future
// rename it to useTransactionNormalizer
export const useTransactionType = (tx: Transaction): TxType => {
  // addressBook = useAddressBook

  return useMemo(() => {
    return getTransactionType(tx)
  }, [tx])
}
