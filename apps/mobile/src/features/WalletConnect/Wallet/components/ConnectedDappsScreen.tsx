import React, { useCallback, useState } from 'react'
import { FlatList } from 'react-native'
import { H2, Text, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { SessionTypes } from '@walletconnect/types'
import { useAppSelector } from '@/src/store/hooks'
import { selectSessions, selectVerifyByTopic } from '../store/walletKitSlice'
import { useDisconnectSession } from '../hooks/useDisconnectSession'
import { ConnectedDappRow } from './ConnectedDappRow'
import { ConnectedDappContextMenu, type MenuAnchor } from './ConnectedDappContextMenu'
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
  // Single screen-level menu state: opening one closes any other, and a full-window backdrop
  // dismisses it on a tap anywhere outside.
  const [menu, setMenu] = useState<{ session: SessionTypes.Struct; anchor: MenuAnchor } | null>(null)

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

  const openMenu = useCallback((session: SessionTypes.Struct, anchor: MenuAnchor) => setMenu({ session, anchor }), [])

  const renderItem = useCallback(
    ({ item }: { item: SessionTypes.Struct }) => (
      <ConnectedDappRow
        session={item}
        variant={verifyByTopic[item.topic]}
        onOpenMenu={openMenu}
        onRequestDisconnect={setSelected}
      />
    ),
    [verifyByTopic, openMenu],
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
      {menu ? (
        <ConnectedDappContextMenu
          anchor={menu.anchor}
          onClose={() => setMenu(null)}
          onDisconnect={() => {
            setSelected(menu.session)
            setMenu(null)
          }}
          testID={`connected-dapp-disconnect-${menu.session.topic}`}
        />
      ) : null}
      <DisconnectConfirmModal
        dapp={selected ? { name: selected.peer.metadata.name, iconUrl: selected.peer.metadata.icons?.[0] } : null}
        isBusy={busyTopic === selected?.topic}
        onConfirm={handleConfirm}
        onClose={() => setSelected(null)}
      />
    </YStack>
  )
}
