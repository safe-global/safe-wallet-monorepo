import React from 'react'
import { Text, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import {
  isERC20Transfer,
  isERC721Transfer,
  isNativeTokenTransfer,
  isOutgoingTransfer,
  isTxQueued,
} from '@/src/utils/transaction-guards'
import { ellipsis, formatValue } from '@/src/utils/formatters'
import { TransferDirection } from '@safe-global/store/gateway/types'
import { TransferTransactionInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Logo } from '@/src/components/Logo'
import { selectActiveChainCurrency } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'

interface TxTokenCardProps {
  bordered?: boolean
  txStatus: Transaction['txStatus']
  inQueue?: boolean
  txInfo: TransferTransactionInfo
  executionInfo?: Transaction['executionInfo']
}

interface tokenDetails {
  value: string
  decimals?: number
  tokenSymbol?: string
  name: string
  logoUri?: string
}

const getTokenDetails = (txInfo: TransferTransactionInfo): tokenDetails => {
  const transfer = txInfo.transferInfo
  const unnamedToken = 'Unnamed token'
  const nativeCurrency = useAppSelector(selectActiveChainCurrency)

  if (isNativeTokenTransfer(transfer) && nativeCurrency) {
    return {
      value: formatValue(transfer.value || '0', nativeCurrency.decimals),
      // take it from the native currency slice
      decimals: nativeCurrency.decimals,
      tokenSymbol: nativeCurrency.symbol,
      name: nativeCurrency.name,
      logoUri: nativeCurrency.logoUri,
    }
  }

  if (isERC20Transfer(transfer)) {
    return {
      value: formatValue(transfer.value, transfer.decimals || 18),
      decimals: transfer.decimals || undefined,
      logoUri: transfer.logoUri || undefined,
      tokenSymbol: ellipsis((transfer.tokenSymbol || 'Unknown Token').trim(), 6),
      name: transfer.tokenName || unnamedToken,
    }
  }

  if (isERC721Transfer(transfer)) {
    return {
      name: transfer.tokenName || unnamedToken,
      tokenSymbol: ellipsis(`${transfer.tokenSymbol || 'Unknown NFT'} #${transfer.tokenId}`, 8),
      value: '1',
      decimals: 0,
      logoUri: transfer?.logoUri || undefined,
    }
  }

  return {
    name: unnamedToken,
    value: '',
  }
}

export function TxTokenCard({ bordered, inQueue, txStatus, executionInfo, txInfo }: TxTokenCardProps) {
  const isSendTx = isOutgoingTransfer(txInfo)
  const icon = isSendTx ? 'transaction-outgoing' : 'transaction-incoming'
  const type = isSendTx ? (isTxQueued(txStatus) ? 'Send' : 'Sent') : 'Received'
  const { logoUri, name, value, tokenSymbol } = getTokenDetails(txInfo)
  const isERC721 = isERC721Transfer(txInfo.transferInfo)
  const isOutgoing = txInfo.direction === TransferDirection.OUTGOING

  return (
    <SafeListItem
      inQueue={inQueue}
      executionInfo={executionInfo}
      label={name}
      icon={icon}
      type={type}
      bordered={bordered}
      leftNode={<Logo logoUri={logoUri} accessibilityLabel={name} />}
      rightNode={
        <View maxWidth="34%">
          <Text color={isOutgoing ? '$color' : '$primary'} textAlign="right">
            {isOutgoing ? '-' : '+'} {ellipsis(value, 8)} {!isERC721 && tokenSymbol}
          </Text>
        </View>
      }
    />
  )
}
