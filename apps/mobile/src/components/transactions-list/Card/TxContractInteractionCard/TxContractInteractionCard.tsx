import React from 'react'
import { Text, Theme } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { MultiSend } from '@safe-global/store/gateway/types'
import { SafeAvatar } from '@/src/components/SafeAvatar/SafeAvatar'
import { CustomTransactionInfo, SafeAppInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxContractInteractionCardProps = {
  txInfo: CustomTransactionInfo | MultiSend
  safeAppInfo?: SafeAppInfo | null
} & Partial<SafeListItemProps>

export function TxContractInteractionCard({ txInfo, safeAppInfo, ...rest }: TxContractInteractionCardProps) {
  const logoUri = txInfo.to.logoUri
  const label = txInfo.to.name || 'Contract interaction'
  return (
    <SafeListItem
      label={label}
      icon={logoUri ? 'transaction-contract' : undefined}
      type={safeAppInfo?.name || txInfo.methodName || ''}
      leftNode={
        <Theme name="logo">
          <SafeAvatar
            size="$10"
            src={logoUri || ''}
            label={label}
            fallbackIcon={<SafeFontIcon name="code-blocks" color="$color" size={16} />}
          />
        </Theme>
      }
      rightNode={<Text>{txInfo.methodName}</Text>}
      {...rest}
    />
  )
}
