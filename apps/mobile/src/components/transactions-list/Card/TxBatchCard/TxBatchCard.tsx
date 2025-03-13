import React from 'react'
import { Avatar, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import type { MultiSend } from '@safe-global/store/gateway/types'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface TxBatchCardProps {
  txInfo: MultiSend
  bordered?: boolean
  label?: string
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

export function TxBatchCard({ txInfo, bordered, executionInfo, inQueue, label, onPress }: TxBatchCardProps) {
  const logoUri = txInfo.to.logoUri

  return (
    <SafeListItem
      label={label || `${txInfo.actionCount} actions`}
      icon="batch"
      onPress={onPress}
      inQueue={inQueue}
      executionInfo={executionInfo}
      type={'Batch'}
      bordered={bordered}
      leftNode={
        <Avatar circular size="$10">
          {logoUri && <Avatar.Image accessibilityLabel="Cam" src={logoUri} />}

          <Avatar.Fallback backgroundColor="$borderLight">
            <View backgroundColor="$borderLightDark" padding="$2" borderRadius={100}>
              <SafeFontIcon color="$primary" name="batch" />
            </View>
          </Avatar.Fallback>
        </Avatar>
      }
    />
  )
}
