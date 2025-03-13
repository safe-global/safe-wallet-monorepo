import React from 'react'
import { Text, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { isERC721Transfer, isOutgoingTransfer, isTxQueued } from '@/src/utils/transaction-guards'
import { ellipsis } from '@/src/utils/formatters'
import { TransferDirection } from '@safe-global/store/gateway/types'
import { TransferTransactionInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Logo } from '@/src/components/Logo'
import { useTokenDetails } from '@/src/hooks/useTokenDetails'

interface TxTokenCardProps {
  bordered?: boolean
  txStatus: Transaction['txStatus']
  inQueue?: boolean
  txInfo: TransferTransactionInfo
  executionInfo?: Transaction['executionInfo']
  onPress?: () => void
}

export function TxTokenCard({ bordered, inQueue, txStatus, executionInfo, txInfo, onPress }: TxTokenCardProps) {
  const isSendTx = isOutgoingTransfer(txInfo)
  const icon = isSendTx ? 'transaction-outgoing' : 'transaction-incoming'
  const type = isSendTx ? (isTxQueued(txStatus) ? 'Send' : 'Sent') : 'Received'
  const { logoUri, name, value, tokenSymbol } = useTokenDetails(txInfo)
  const isERC721 = isERC721Transfer(txInfo.transferInfo)
  const isOutgoing = txInfo.direction === TransferDirection.OUTGOING

  return (
    <SafeListItem
      inQueue={inQueue}
      executionInfo={executionInfo}
      label={name}
      icon={icon}
      type={type}
      onPress={onPress}
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
