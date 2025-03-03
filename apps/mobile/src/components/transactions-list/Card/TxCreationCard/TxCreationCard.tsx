import React from 'react'
import { Theme, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { shortenAddress } from '@/src/utils/formatters'
import type { Transaction, CreationTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface TxCreationCardProps {
  txInfo: CreationTransactionInfo
  bordered?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

export function TxCreationCard({ txInfo, executionInfo, bordered, inQueue, onPress }: TxCreationCardProps) {
  return (
    <SafeListItem
      inQueue={inQueue}
      executionInfo={executionInfo}
      bordered={bordered}
      label={`Created by: ${shortenAddress(txInfo.creator.value)}`}
      type="Safe Account created"
      leftNode={
        <Theme name="logo">
          <View backgroundColor="$background" padding="$2" borderRadius={100}>
            <SafeFontIcon name="plus" />
          </View>
        </Theme>
      }
      onPress={onPress}
    />
  )
}
