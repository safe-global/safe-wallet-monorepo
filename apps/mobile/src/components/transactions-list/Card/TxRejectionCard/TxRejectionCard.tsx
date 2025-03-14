import React from 'react'
import { View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import type { Cancellation } from '@safe-global/store/gateway/types'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface TxRejectionCardProps {
  bordered?: boolean
  txInfo: Cancellation
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

export function TxRejectionCard({ bordered, executionInfo, txInfo, inQueue, onPress }: TxRejectionCardProps) {
  return (
    <SafeListItem
      type="Rejected"
      executionInfo={executionInfo}
      label={txInfo.methodName || 'On-chain rejection'}
      inQueue={inQueue}
      bordered={bordered}
      leftNode={
        <View borderRadius={100} padding="$2" backgroundColor="$errorDark">
          <SafeFontIcon color="$error" name="close-outlined" />
        </View>
      }
      onPress={onPress}
    />
  )
}
