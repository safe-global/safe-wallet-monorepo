import React from 'react'
import { Text, Theme } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { MultiSend } from '@safe-global/store/gateway/types'
import { CustomTransactionInfo, SafeAppInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'
import { Logo } from '@/src/components/Logo'

type TxContractInteractionCardProps = {
  txInfo: CustomTransactionInfo | MultiSend
  safeAppInfo?: SafeAppInfo | null
} & Partial<SafeListItemProps>

export function TxContractInteractionCard({ txInfo, safeAppInfo, ...rest }: TxContractInteractionCardProps) {
  const logoUri = safeAppInfo?.logoUri || txInfo.to.logoUri
  const label = safeAppInfo?.name || txInfo.to.name || 'Contract interaction'

  return (
    <SafeListItem
      label={label}
      icon={logoUri ? 'transaction-contract' : undefined}
      type={safeAppInfo?.name || txInfo.methodName || ''}
      leftNode={
        <Theme name="logo">
          <Logo
            size="$8"
            logoUri={logoUri || ''}
            fallbackIcon="code-blocks"
            imageBackground="$background"
            accessibilityLabel={label}
          />
        </Theme>
      }
      rightNode={<Text>{txInfo.methodName}</Text>}
      {...rest}
    />
  )
}
