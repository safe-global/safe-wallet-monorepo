import React from 'react'
import { Text } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import type { MultiSend } from '@safe-global/store/gateway/types'
import type { SafeAppInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'
import { Logo } from '@/src/components/Logo'

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
        <Logo
          logoUri={safeAppInfo.logoUri}
          size="$8"
          fallbackIcon="code-blocks"
          imageBackground="$background"
          accessibilityLabel={safeAppInfo.name}
        />
      }
      rightNode={<Text>{txInfo.methodName}</Text>}
      {...rest}
    />
  )
}
