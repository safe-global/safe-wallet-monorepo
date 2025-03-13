import React from 'react'
import { Avatar, Text, Theme, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { MultiSend } from '@safe-global/store/gateway/types'
import { Transaction, CustomTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface TxContractInteractionCardProps {
  bordered?: boolean
  txInfo: CustomTransactionInfo | MultiSend
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

export function TxContractInteractionCard({
  bordered,
  executionInfo,
  txInfo,
  inQueue,
  onPress,
}: TxContractInteractionCardProps) {
  const logoUri = txInfo.to.logoUri
  const label = txInfo.to.name || 'Contract interaction'
  return (
    <SafeListItem
      label={label}
      icon={logoUri ? 'transaction-contract' : undefined}
      type={txInfo.methodName || ''}
      bordered={bordered}
      executionInfo={executionInfo}
      inQueue={inQueue}
      leftNode={
        <Avatar circular size="$10">
          <Theme name="logo">
            {logoUri && <Avatar.Image backgroundColor="$color" accessibilityLabel={label} src={logoUri} />}

            <Avatar.Fallback backgroundColor="$background">
              <View backgroundColor="$background" padding="$2" borderRadius={100}>
                <SafeFontIcon name="code-blocks" color="$color" />
              </View>
            </Avatar.Fallback>
          </Theme>
        </Avatar>
      }
      rightNode={<Text>{txInfo.methodName}</Text>}
      onPress={onPress}
    />
  )
}
