import React from 'react'
import { Avatar, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import type { MultiSend } from '@safe-global/store/gateway/types'
import type { SafeAppInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxBatchCardProps = {
  txInfo: MultiSend
  safeAppInfo?: SafeAppInfo | null
} & Partial<SafeListItemProps>

export function TxBatchCard({ txInfo, safeAppInfo, ...rest }: TxBatchCardProps) {
  const logoUri = safeAppInfo?.logoUri || txInfo.to.logoUri

  return (
    <SafeListItem
      label={`${txInfo.actionCount} actions`}
      icon="batch"
      type={safeAppInfo?.name || 'Batch'}
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
      {...rest}
    />
  )
}
