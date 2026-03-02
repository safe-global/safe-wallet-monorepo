import React, { useCallback, useMemo, useState } from 'react'
import { Keyboard, Pressable, TextInput, StyleSheet } from 'react-native'
import { Text, View, useTheme } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Loader } from '@/src/components/Loader'
import { Alert } from '@/src/components/Alert'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { shortenAddress } from '@/src/utils/formatters'
import { useTokenBalances } from '@/src/features/Assets/components/Tokens/useTokenBalances'
import { TokenListItem } from './components/TokenListItem'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

function filterTokensByQuery(items: Balance[] | undefined, query: string): Balance[] {
  if (!items) {
    return []
  }
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return items
  }
  return items.filter((item) => {
    const { name, symbol, address } = item.tokenInfo
    return (
      name.toLowerCase().includes(trimmed) ||
      symbol.toLowerCase().includes(trimmed) ||
      address.toLowerCase().includes(trimmed)
    )
  })
}

function RecipientDisplay({ name, address }: { name?: string; address: string }) {
  if (name) {
    return (
      <View gap={2}>
        <Text fontSize="$4" fontWeight={600} color="$color">
          {name}
        </Text>
        <Text fontSize="$3" color="$colorSecondary">
          {shortenAddress(address, 4)}
        </Text>
      </View>
    )
  }
  return (
    <Text fontSize="$4" color="$color">
      {shortenAddress(address, 6)}
    </Text>
  )
}

function EmptySearchResult({ searchQuery }: { searchQuery: string }) {
  if (!searchQuery.trim()) {
    return null
  }
  return (
    <View paddingVertical="$6" alignItems="center">
      <Text color="$colorSecondary">No tokens match your search</Text>
    </View>
  )
}

export function SelectTokenContainer() {
  const router = useRouter()
  const theme = useTheme()
  const params = useLocalSearchParams<{
    recipientAddress: string
    recipientName?: string
  }>()
  const { recipientAddress, recipientName } = params
  const { visibleItems, currency, isLoading, error, refetch } = useTokenBalances()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = useMemo(() => filterTokensByQuery(visibleItems, searchQuery), [visibleItems, searchQuery])

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

  const handleScrollBeginDrag = useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const listHeader = useMemo(
    () => (
      <View gap="$5" paddingBottom="$4">
        <View gap="$2">
          <View flexDirection="row" alignItems="center" gap="$2">
            <SafeFontIcon name="send-to" size={16} color="$color" />
            <Text fontSize="$4" color="$color">
              Recipient
            </Text>
          </View>
          <Pressable onPress={() => router.back()} testID="recipient-summary">
            <View
              flexDirection="row"
              alignItems="center"
              backgroundColor="$backgroundSkeleton"
              borderRadius={8}
              paddingHorizontal="$4"
              height={64}
              gap="$2"
            >
              <Text fontSize="$4" color="$colorSecondary">
                To:
              </Text>
              <RecipientDisplay name={recipientName} address={recipientAddress ?? ''} />
            </View>
          </Pressable>
        </View>

        <View gap="$3">
          <View flexDirection="row" alignItems="center" justifyContent="space-between" paddingRight="$1">
            <View flexDirection="row" alignItems="center" gap="$2">
              <SafeFontIcon name="token" size={16} color="$color" />
              <Text fontSize="$4" color="$color">
                Select token:
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={handleManageTokens} testID="manage-tokens-button">
              <SafeFontIcon name="options-horizontal" size={16} color="$colorSecondary" />
            </Pressable>
          </View>

          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: String(theme.backgroundSkeleton.get()),
              },
            ]}
          >
            <SafeFontIcon name="search" size={16} color="$colorSecondary" />
            <TextInput
              style={[styles.searchInput, { color: String(theme.color.get()) }]}
              placeholder="Search"
              placeholderTextColor={String(theme.colorSecondary.get())}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              testID="token-search-input"
            />
          </View>
        </View>
      </View>
    ),
    [recipientAddress, recipientName, router, searchQuery, theme, handleManageTokens],
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
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item: Balance) => item.tokenInfo.address}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View height={8} />}
        contentContainerStyle={{ padding: 16 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={handleScrollBeginDrag}
        ListEmptyComponent={<EmptySearchResult searchQuery={searchQuery} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
})
