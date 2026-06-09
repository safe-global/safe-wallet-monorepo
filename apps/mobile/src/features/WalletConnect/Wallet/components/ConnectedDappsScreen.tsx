import React, { useCallback, useState } from 'react'
import { FlatList } from 'react-native'
import { H2, Text, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { SessionTypes } from '@walletconnect/types'
import { useAppSelector } from '@/src/store/hooks'
import { selectSessions, selectVerifyByTopic } from '../store/walletKitSlice'
import { useDisconnectSession } from '../hooks/useDisconnectSession'
import { ConnectedDappRow } from './ConnectedDappRow'
import { DisconnectConfirmModal } from './DisconnectConfirmModal'

/**
 * Lists the Safe's live WalletConnect dApp sessions. Each row exposes a 3-dots menu and a
 * left-swipe, both routing to a shared confirmation sheet; confirming delegates to
 * `useDisconnectSession`. The row drops out as soon as the slice mirror updates, and a
 * dApp-initiated `session_delete` removes it silently (handled in the provider, no toast).
 */
export const ConnectedDappsScreen: React.FC = () => {
  const sessions = useAppSelector(selectSessions)
  const verifyByTopic = useAppSelector(selectVerifyByTopic)
  const { disconnect, busyTopic } = useDisconnectSession()
  const insets = useSafeAreaInsets()
  const [selected, setSelected] = useState<SessionTypes.Struct | null>(null)

  const handleConfirm = useCallback(async () => {
    if (!selected) {
      return
    }
    await disconnect(selected.topic, selected.peer.metadata.name)
    setSelected(null)
  }, [selected, disconnect])

  const renderItem = useCallback(
    ({ item }: { item: SessionTypes.Struct }) => (
      <ConnectedDappRow session={item} variant={verifyByTopic[item.topic]} onRequestDisconnect={setSelected} />
    ),
    [verifyByTopic],
  )

  return (
    <YStack flex={1} backgroundColor="$background">
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.topic}
        ListHeaderComponent={
          <YStack gap="$2" paddingVertical="$3">
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
