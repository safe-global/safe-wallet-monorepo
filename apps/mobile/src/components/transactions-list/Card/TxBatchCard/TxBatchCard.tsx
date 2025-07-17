import React from 'react'
import { Theme, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import type { MultiSend } from '@safe-global/store/gateway/types'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxBatchCardProps = {
  txInfo: MultiSend
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
