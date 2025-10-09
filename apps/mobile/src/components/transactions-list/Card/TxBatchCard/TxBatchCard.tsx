import React from 'react'
import { Theme, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import type { MultiSendTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxBatchCardProps = {
  txInfo: MultiSendTransactionInfo
} & Partial<SafeListItemProps>

export function TxBatchCard({ txInfo, ...rest }: TxBatchCardProps) {
  return (
    <SafeListItem
      label={`${txInfo.actionCount} actions`}
      icon="batch"
      type={'Batch'}
      leftNode={
        <Theme name="logo">
          <View backgroundColor="$background" padding="$2" borderRadius={100}>
            <SafeFontIcon name="batch" size={16} />
          </View>
        </Theme>
      }
      {...rest}
    />
  )
}
