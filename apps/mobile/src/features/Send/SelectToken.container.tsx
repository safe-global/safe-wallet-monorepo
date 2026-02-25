import React, { useCallback } from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Loader } from '@/src/components/Loader'
import { Alert } from '@/src/components/Alert'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { shortenAddress } from '@/src/utils/formatters'
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

  const handleManageTokens = useCallback(() => {
    router.push('/manage-tokens-sheet')
  }, [router])

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
      <View paddingHorizontal="$4" paddingTop="$5" gap="$5">
        <View gap="$2">
          <View flexDirection="row" alignItems="center" gap="$2">
            <SafeFontIcon name="send-to" size={16} color="$colorSecondary" />
            <Text fontSize="$4" color="$colorSecondary">
              Recipient
            </Text>
          </View>
          <Pressable onPress={() => router.back()} testID="recipient-summary">
            <View
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              backgroundColor="$backgroundSkeleton"
              borderRadius={8}
              paddingLeft="$4"
              paddingRight="$2"
              height={64}
            >
              <View flexDirection="row" alignItems="baseline" gap="$2">
                <Text fontSize="$4" color="$colorSecondary">
                  To:
                </Text>
                <Text fontSize="$5" color="$color">
                  {recipientName ?? shortenAddress(recipientAddress ?? '', 6)}
                </Text>
              </View>
              <SafeFontIcon name="chevron-right" size={20} color="$colorSecondary" />
            </View>
          </Pressable>
        </View>

        <View
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingRight="$1"
        >
          <View flexDirection="row" alignItems="center" gap="$2">
            <SafeFontIcon name="token" size={16} color="$colorSecondary" />
            <Text fontSize="$4" color="$colorSecondary">
              Select token:
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            onPress={handleManageTokens}
            testID="manage-tokens-button"
          >
            <SafeFontIcon
              name="options-horizontal"
              size={16}
              color="$colorSecondary"
            />
          </Pressable>
        </View>
      </View>

      <FlashList
        data={visibleItems}
        renderItem={renderItem}
        keyExtractor={(item: Balance) => item.tokenInfo.address}
        estimatedItemSize={72}
        ItemSeparatorComponent={() => <View height={8} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  )
}
