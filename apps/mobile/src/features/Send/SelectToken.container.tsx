import React, { useCallback } from 'react'
import { Text, View } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Loader } from '@/src/components/Loader'
import { Alert } from '@/src/components/Alert'
import { useTokenBalances } from '@/src/features/Assets/components/Tokens/useTokenBalances'
import { TokenListItem } from './components/TokenListItem'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
export function SelectTokenContainer() {
  const router = useRouter()
  const params = useLocalSearchParams<{ recipientAddress: string; recipientName?: string }>()
  const { recipientAddress, recipientName } = params
  const { visibleItems, currency, isLoading, error, refetch } = useTokenBalances()

  const handleTokenPress = useCallback(
    (tokenAddress: string) => {
      router.push({
        pathname: '/(send)/amount',
        params: {
          recipientAddress,
          ...(recipientName ? { recipientName } : {}),
          tokenAddress,
        },
      })
    },
    [recipientAddress, recipientName, router],
  )

  const renderItem = useCallback(
    ({ item }: { item: Balance }) => <TokenListItem item={item} currency={currency} onPress={handleTokenPress} />,
    [currency, handleTokenPress],
  )

  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Loader size={48} color="#12FF80" />
      </View>
    )
  }

  if (error) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Alert type="error" message="Failed to load balances" />
        <View marginTop="$3">
          <Text color="$primary" onPress={() => refetch()}>
            Retry
          </Text>
        </View>
      </View>
    )
  }

  if (!visibleItems || visibleItems.length === 0) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text color="$colorSecondary">No tokens available</Text>
      </View>
    )
  }

  return (
    <View flex={1}>
      <FlashList
        data={visibleItems}
        renderItem={renderItem}
        keyExtractor={(item: Balance) => item.tokenInfo.address}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  )
}
