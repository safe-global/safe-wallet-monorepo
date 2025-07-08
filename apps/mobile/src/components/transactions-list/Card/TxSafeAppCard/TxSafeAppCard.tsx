import React from 'react'
import { Avatar, Text, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import type { MultiSend } from '@safe-global/store/gateway/types'
import type { SafeAppInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxSafeAppCardProps = {
  safeAppInfo: SafeAppInfo
  txInfo: MultiSend
} & Partial<SafeListItemProps>

export function TxSafeAppCard({ safeAppInfo, txInfo, ...rest }: TxSafeAppCardProps) {
  return (
    <SafeListItem
      label={safeAppInfo.name}
      icon="transaction-contract"
      type="Safe app"
      leftNode={
        <Avatar circular size="$10">
          {safeAppInfo.logoUri && (
            <Avatar.Image testID="safe-app-image" accessibilityLabel={safeAppInfo.name} src={safeAppInfo.logoUri} />
          )}

          <Avatar.Fallback backgroundColor="$borderLight">
            <View backgroundColor="$borderLightDark" padding="$2" borderRadius={100}>
              <SafeFontIcon testID="safe-app-fallback" name="code-blocks" color="$color" />
            </View>
          </Avatar.Fallback>
        </Avatar>
      }
      rightNode={<Text>{txInfo.methodName}</Text>}
      {...rest}
    />
  )
}
