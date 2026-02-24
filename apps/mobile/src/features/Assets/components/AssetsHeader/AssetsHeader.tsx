import React from 'react'
import { Pressable } from 'react-native'
import { BalanceContainer } from '../Balance'
import { PendingTransactions } from '@/src/components/StatusBanners/PendingTransactions'
import { View, Text, XStack } from 'tamagui'
import { StyledAssetsHeader } from './styles'
import { ReadOnlyContainer } from '../ReadOnly/ReadOnly.container'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface AssetsHeaderProps {
  amount: number
  isLoading: boolean
  onPendingTransactionsPress: () => void
  hasMore: boolean
  showSendButton?: boolean
  onSendPress?: () => void
}

export function AssetsHeader({
  amount,
  isLoading,
  onPendingTransactionsPress,
  hasMore,
  showSendButton,
  onSendPress,
}: AssetsHeaderProps) {
  return (
    <StyledAssetsHeader>
      <View marginBottom="$8" marginTop="$4">
        {amount > 0 && (
          <PendingTransactions
            isLoading={isLoading}
            onPress={onPendingTransactionsPress}
            number={`${amount}${hasMore ? '+' : ''}`}
          />
        )}
      </View>

      <BalanceContainer />

      {showSendButton && onSendPress && (
        <XStack marginBottom="$4" gap="$3">
          <Pressable onPress={onSendPress} testID="send-button">
            <View
              flexDirection="row"
              alignItems="center"
              gap="$2"
              backgroundColor="$primary"
              borderRadius={24}
              paddingHorizontal="$4"
              paddingVertical="$2"
            >
              <SafeFontIcon name="send-to" size={16} color="$primaryContainer" />
              <Text fontSize="$3" fontWeight={600} color="$primaryContainer">
                Send
              </Text>
            </View>
          </Pressable>
        </XStack>
      )}

      <ReadOnlyContainer />
    </StyledAssetsHeader>
  )
}
