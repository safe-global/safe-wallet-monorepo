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
  onReceivePress?: () => void
}

export function AssetsHeader({
  amount,
  isLoading,
  onPendingTransactionsPress,
  hasMore,
  showSendButton,
  onSendPress,
  onReceivePress,
}: AssetsHeaderProps) {
  return (
    <StyledAssetsHeader>
      <ReadOnlyContainer marginTop="$4" marginBottom="$2" />

      <BalanceContainer />

      <XStack marginTop="$2" marginBottom="$4" justifyContent="center" gap="$2">
        <Pressable onPress={onReceivePress} testID="receive-button">
          <View
            flexDirection="row"
            alignItems="center"
            gap="$1"
            backgroundColor="$backgroundSkeleton"
            borderRadius={8}
            paddingHorizontal="$5"
            paddingVertical="$3"
          >
            <SafeFontIcon name="qr-code" size={18} color="$color" />
            <Text fontSize="$4" fontWeight={700} color="$color">
              Receive
            </Text>
          </View>
        </Pressable>
        {showSendButton && (
          <Pressable onPress={onSendPress} testID="send-button">
            <View
              flexDirection="row"
              alignItems="center"
              gap="$1"
              backgroundColor="$backgroundSkeleton"
              borderRadius={8}
              paddingHorizontal="$5"
              paddingVertical="$3"
            >
              <SafeFontIcon name="transaction-outgoing" size={18} color="$color" />
              <Text fontSize="$4" fontWeight={700} color="$color">
                Send
              </Text>
            </View>
          </Pressable>
        )}
      </XStack>

      <View marginBottom="$4" marginTop="$2">
        {amount > 0 && (
          <PendingTransactions
            isLoading={isLoading}
            onPress={onPendingTransactionsPress}
            number={`${amount}${hasMore ? '+' : ''}`}
          />
        )}
      </View>
    </StyledAssetsHeader>
  )
}
