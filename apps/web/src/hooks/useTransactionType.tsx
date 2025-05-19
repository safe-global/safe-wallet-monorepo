import { getOrderClass } from '@/features/swap/helpers/utils'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import {
  type AddressEx,
  SettingsInfoType,
  TransactionInfoType,
  type TransactionSummary,
} from '@safe-global/safe-gateway-typescript-sdk'
import SwapIcon from '@/public/images/common/swap.svg'
import StakeIcon from '@/public/images/common/stake.svg'
import EarnIcon from '@/public/images/common/earn.svg'
import NestedSafeIcon from '@/public/images/transactions/nestedTx.svg'
import BatchIcon from '@/public/images/common/multisend.svg'

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
import { SvgIcon } from '@mui/material'

const getTxTo = ({ txInfo }: Pick<TransactionSummary, 'txInfo'>): AddressEx | undefined => {
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

export const getTransactionType = (tx: TransactionSummary, addressBook: AddressBook): TxType => {
  const toAddress = getTxTo(tx)
  const addressBookName = toAddress?.value ? addressBook[toAddress.value] : undefined

  switch (tx.txInfo.type) {
    case TransactionInfoType.CREATION: {
      return {
        icon: toAddress?.logoUri || '/images/transactions/settings.svg',
        text: 'Safe Account created',
      }
    }
    case TransactionInfoType.SWAP_TRANSFER:
    case TransactionInfoType.TRANSFER: {
      const isSendTx = isOutgoingTransfer(tx.txInfo)

      return {
        icon: isSendTx ? '/images/transactions/outgoing.svg' : '/images/transactions/incoming.svg',
        text: isSendTx ? (isTxQueued(tx.txStatus) ? 'Send' : 'Sent') : 'Received',
      }
    }
    case TransactionInfoType.SETTINGS_CHANGE: {
      // deleteGuard doesn't exist in Solidity
      // It is decoded as 'setGuard' with a settingsInfo.type of 'DELETE_GUARD'
      const isDeleteGuard = tx.txInfo.settingsInfo?.type === SettingsInfoType.DELETE_GUARD

      return {
        icon: '/images/transactions/settings.svg',
        text: isDeleteGuard ? 'deleteGuard' : tx.txInfo.dataDecoded.method,
      }
    }
    case TransactionInfoType.SWAP_ORDER: {
      const orderClass = getOrderClass(tx.txInfo)
      const altText = orderClass === 'limit' ? 'Limit order' : 'Swap order'

      return {
        icon: <SvgIcon component={SwapIcon} inheritViewBox fontSize="small" alt={altText} />,
        text: altText,
      }
    }
    case TransactionInfoType.TWAP_ORDER: {
      return {
        icon: <SvgIcon component={SwapIcon} inheritViewBox fontSize="small" alt="Twap Order" />,
        text: TWAP_ORDER_TITLE,
      }
    }
    case TransactionInfoType.NATIVE_STAKING_DEPOSIT: {
      return {
        icon: <SvgIcon component={StakeIcon} inheritViewBox fontSize="small" alt="Stake" />,
        text: 'Stake',
      }
    }
    case TransactionInfoType.NATIVE_STAKING_VALIDATORS_EXIT: {
      return {
        icon: <SvgIcon component={StakeIcon} inheritViewBox fontSize="small" alt="Withdraw request" />,
        text: 'Withdraw request',
      }
    }
    case TransactionInfoType.NATIVE_STAKING_WITHDRAW: {
      return {
        icon: <SvgIcon component={StakeIcon} inheritViewBox fontSize="small" alt="Claim" />,
        text: 'Claim',
      }
    }
    // @ts-ignore TODO: Add types to old SDK or switch to auto-generated
    case 'VaultDeposit': {
      return {
        icon: <SvgIcon component={EarnIcon} inheritViewBox fontSize="small" alt="Deposit icon" />,
        text: 'Deposit',
      }
    }
    // @ts-ignore TODO: Add types to old SDK or switch to auto-generated
    case 'VaultRedeem': {
      return {
        icon: <SvgIcon component={EarnIcon} inheritViewBox fontSize="small" alt="Withdraw icon" />,
        text: 'Withdraw',
      }
    }
    case TransactionInfoType.CUSTOM: {
      if (tx.safeAppInfo) {
        return {
          icon: tx.safeAppInfo.logoUri,
          text: tx.safeAppInfo.name,
        }
      }

      if (isMultiSendTxInfo(tx.txInfo)) {
        return {
          icon: <SvgIcon component={BatchIcon} inheritViewBox fontSize="small" alt="Batch" />,
          text: 'Batch',
        }
      }

      if (isModuleExecutionInfo(tx.executionInfo)) {
        return {
          icon: toAddress?.logoUri || '/images/transactions/custom.svg',
          text: toAddress?.name || 'Contract interaction',
        }
      }

      if (isCancellationTxInfo(tx.txInfo)) {
        return {
          icon: '/images/transactions/circle-cross-red.svg',
          text: 'On-chain rejection',
        }
      }

      if (isNestedConfirmationTxInfo(tx.txInfo)) {
        return {
          icon: <SvgIcon component={NestedSafeIcon} inheritViewBox fontSize="small" alt="Nested Safe" />,
          text: `Nested Safe${addressBookName ? `: ${addressBookName}` : ''}`,
        }
      }

      return {
        icon: toAddress?.logoUri || '/images/transactions/custom.svg',
        text: addressBookName || toAddress?.name || 'Contract interaction',
      }
    }
    default: {
      return {
        icon: '/images/transactions/custom.svg',
        text: addressBookName || 'Contract interaction',
      }
    }
  }
}

export const useTransactionType = (tx: TransactionSummary): TxType => {
  const addressBook = useAddressBook()

  return useMemo(() => {
    return getTransactionType(tx, addressBook)
  }, [tx, addressBook])
}
