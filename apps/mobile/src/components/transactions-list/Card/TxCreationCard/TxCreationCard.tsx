import React from 'react'
import { Theme, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { shortenAddress } from '@/src/utils/formatters'
import type { CreationTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxCreationCardProps = {
  txInfo: CreationTransactionInfo
} & Partial<SafeListItemProps>

export function TxCreationCard({ txInfo, ...rest }: TxCreationCardProps) {
  return (
    <SafeListItem
      label={`Created by: ${shortenAddress(txInfo.creator.value)}`}
      type="Safe Account created"
      leftNode={
        <Theme name="logo">
          <View backgroundColor="$background" padding="$2" borderRadius={100}>
            <SafeFontIcon name="plus" />
          </View>
        </Theme>
      }
      {...rest}
    />
  )
}
