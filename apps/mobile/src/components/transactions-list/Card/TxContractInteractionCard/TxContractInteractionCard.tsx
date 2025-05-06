import React from 'react'
import { Text, Theme } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { MultiSend } from '@safe-global/store/gateway/types'
import { SafeAvatar } from '@/src/components/SafeAvatar/SafeAvatar'
import { Transaction, CustomTransactionInfo, SafeAppInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface TxContractInteractionCardProps {
  bordered?: boolean
  txInfo: CustomTransactionInfo | MultiSend
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
  safeAppInfo?: SafeAppInfo | null
}

export function TxContractInteractionCard({
  bordered,
  executionInfo,
  txInfo,
  inQueue,
  onPress,
  safeAppInfo,
}: TxContractInteractionCardProps) {
  const logoUri = txInfo.to.logoUri
  const label = txInfo.to.name || 'Contract interaction'
  return (
    <SafeListItem
      label={label}
      icon={logoUri ? 'transaction-contract' : undefined}
      type={safeAppInfo?.name || txInfo.methodName || ''}
      bordered={bordered}
      executionInfo={executionInfo}
      inQueue={inQueue}
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
      onPress={onPress}
    />
  )
}
