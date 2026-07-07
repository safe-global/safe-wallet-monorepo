import React, { useCallback, useRef, useState } from 'react'
import { FlatList } from 'react-native'
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable'
import { H2, Text, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { SessionTypes } from '@walletconnect/types'
import { useAppSelector } from '@/src/store/hooks'
import { selectSessions, selectVerifyByTopic } from '../store/walletKitSlice'
import { useDisconnectSession } from '../hooks/useDisconnectSession'
import { ConnectedDappRow } from './ConnectedDappRow'
import { DisconnectConfirmModal } from './DisconnectConfirmModal'

/** Lists live WalletConnect dApp sessions; a 3-dots menu or left-swipe routes to a shared confirm sheet. */
export const ConnectedDappsScreen: React.FC = () => {
  const sessions = useAppSelector(selectSessions)
  const verifyByTopic = useAppSelector(selectVerifyByTopic)
  const { disconnect, busyTopic } = useDisconnectSession()
  const insets = useSafeAreaInsets()
  const [selected, setSelected] = useState<SessionTypes.Struct | null>(null)

  // The row currently swiped open
  const openSwipeRef = useRef<SwipeableMethods | null>(null)

  const handleSwipeOpenStart = useCallback((methods: SwipeableMethods) => {
    if (openSwipeRef.current && openSwipeRef.current !== methods) {
      openSwipeRef.current.close()
    }
    openSwipeRef.current = methods
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!selected) {
      return
    }
    // Keep the sheet open on failure (the error is toasted) so the user can retry or cancel.
    const disconnected = await disconnect(selected.topic, selected.peer.metadata.name)
    if (disconnected) {
      setSelected(null)
    }
  }, [selected, disconnect])

  const renderItem = useCallback(
    ({ item }: { item: SessionTypes.Struct }) => (
      <ConnectedDappRow
        session={item}
        variant={verifyByTopic[item.topic]}
        onRequestDisconnect={setSelected}
        onSwipeOpenStart={handleSwipeOpenStart}
      />
    ),
    [verifyByTopic, handleSwipeOpenStart],
  )

  return (
    <YStack flex={1} backgroundColor="$background">
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.topic}
        ListHeaderComponent={
          <YStack gap="$2" paddingVertical="$6">
            <H2 fontWeight="600">Connected apps</H2>
            <Text color="$colorSecondary">Third-party apps you've connected to your Safe.</Text>
          </YStack>
        }
        renderItem={renderItem}
        ItemSeparatorComponent={() => <YStack height="$2" />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
        ListEmptyComponent={
          <Text color="$colorSecondary" textAlign="center" marginTop="$8">
            No connected apps.
          </Text>
        }
      />
      <DisconnectConfirmModal
        dapp={selected ? { name: selected.peer.metadata.name, iconUrl: selected.peer.metadata.icons?.[0] } : null}
        isBusy={busyTopic === selected?.topic}
        onConfirm={handleConfirm}
        onClose={() => setSelected(null)}
      />
    </YStack>
  )
}
