import React, { useCallback, useMemo, useState } from 'react'
import { Pressable, TextInput, StyleSheet } from 'react-native'
import { Text, View, useTheme } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Loader } from '@/src/components/Loader'
import { Alert } from '@/src/components/Alert'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useTokenBalances } from '@/src/features/Assets/components/Tokens/useTokenBalances'
import { TokenListItem } from './components/TokenListItem'
import { RecipientDisplay } from './components/RecipientDisplay'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

function ItemSeparator() {
  return <View height={8} />
}

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

interface TokenListHeaderProps {
  recipientAddress: string
  recipientName?: string
  searchQuery: string
  onRecipientPress: () => void
  onManageTokens: () => void
  onSearchChange: (text: string) => void
}

function TokenListHeader({
  recipientAddress,
  recipientName,
  searchQuery,
  onRecipientPress,
  onManageTokens,
  onSearchChange,
}: TokenListHeaderProps) {
  const theme = useTheme()

  return (
    <View gap="$5" paddingBottom="$4">
      <View gap="$2">
        <View flexDirection="row" alignItems="center" gap="$2">
          <SafeFontIcon name="send-to" size={16} color="$color" />
          <Text fontSize="$4" color="$color">
            Recipient
          </Text>
        </View>
        <Pressable onPress={onRecipientPress} testID="recipient-summary">
          <View
            flexDirection="row"
            alignItems="center"
            backgroundColor="$backgroundSkeleton"
            borderRadius={8}
            paddingHorizontal="$4"
            height={64}
            gap="$2"
          >
            <RecipientDisplay name={recipientName} address={recipientAddress} />
          </View>
        </Pressable>
      </View>

      <View gap="$3">
        <View flexDirection="row" alignItems="center" justifyContent="space-between" paddingRight="$1">
          <View flexDirection="row" alignItems="center" gap="$1">
            <SafeFontIcon name="token" size={16} color="$color" />
            <Text fontSize={16} fontWeight={700} color="$color" paddingHorizontal="$1">
              Select token:
            </Text>
          </View>
          <Pressable hitSlop={8} onPress={onManageTokens} testID="manage-tokens-button">
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
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            testID="token-search-input"
          />
        </View>
      </View>
    </View>
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

  const handleRecipientPress = useCallback(() => {
    router.back()
  }, [router])

  const renderItem = useCallback(
    ({ item }: { item: Balance }) => <TokenListItem item={item} currency={currency} onPress={handleTokenPress} />,
    [currency, handleTokenPress],
  )

  const listHeader = (
    <TokenListHeader
      recipientAddress={recipientAddress ?? ''}
      recipientName={recipientName}
      searchQuery={searchQuery}
      onRecipientPress={handleRecipientPress}
      onManageTokens={handleManageTokens}
      onSearchChange={setSearchQuery}
    />
  )

  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Loader size={48} color={String(theme.primary.get())} />
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
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={{ padding: 16 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
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
