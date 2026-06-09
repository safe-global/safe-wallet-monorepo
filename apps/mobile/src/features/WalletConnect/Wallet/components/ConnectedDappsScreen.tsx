import React, { useCallback, useState } from 'react'
import { FlatList, Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import type { SessionTypes } from '@walletconnect/types'
import { useAppSelector } from '@/src/store/hooks'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { selectSessions, selectVerifyByTopic } from '../store/walletKitSlice'
import { useDisconnectSession } from '../hooks/useDisconnectSession'
import { DappIcon } from './DappIcon'
import { VerifyStatusIcon } from './VerifyStatusIcon'
import { DisconnectConfirmModal } from './DisconnectConfirmModal'

/**
 * Lists the Safe's live WalletConnect dApp sessions. Each row carries the verify badge
 * captured at approval and an overflow (3-dots) control that opens the disconnect confirmation.
 * Disconnecting is delegated to the shared `useDisconnectSession` helper; the confirm sheet
 * reflects its busy state and the row drops out as soon as the slice mirror updates.
 */
export const ConnectedDappsScreen: React.FC = () => {
  const sessions = useAppSelector(selectSessions)
  const verifyByTopic = useAppSelector(selectVerifyByTopic)
  const { disconnect, busyTopic } = useDisconnectSession()
  const [selected, setSelected] = useState<SessionTypes.Struct | null>(null)

  const handleConfirm = useCallback(async () => {
    if (!selected) {
      return
    }
    await disconnect(selected.topic, selected.peer.metadata.name)
    setSelected(null)
  }, [selected, disconnect])

  const renderItem = useCallback(
    ({ item }: { item: SessionTypes.Struct }) => {
      const meta = item.peer.metadata
      const variant = verifyByTopic[item.topic]
      return (
        <XStack gap="$3" paddingVertical="$3" alignItems="center" testID="connected-dapp-row">
          <DappIcon url={meta.icons?.[0]} size={40} />
          <YStack flex={1}>
            <XStack gap="$2" alignItems="center">
              <Text fontWeight="600" numberOfLines={1}>
                {meta.name}
              </Text>
              {variant ? <VerifyStatusIcon variant={variant} size={16} /> : null}
            </XStack>
            {meta.url ? (
              <Text color="$colorSecondary" numberOfLines={1}>
                {meta.url}
              </Text>
            ) : null}
          </YStack>
          <Pressable
            hitSlop={8}
            onPress={() => setSelected(item)}
            accessibilityLabel={`Disconnect ${meta.name}`}
            testID={`connected-dapp-menu-${item.topic}`}
          >
            <SafeFontIcon name="options-horizontal" color="$colorSecondary" />
          </Pressable>
        </XStack>
      )
    },
    [verifyByTopic],
  )

  return (
    <YStack flex={1}>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.topic}
        contentContainerStyle={{ padding: 16 }}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text color="$colorSecondary" textAlign="center" marginTop="$8">
            No connected apps.
          </Text>
        }
      />
      <DisconnectConfirmModal
        dappName={selected?.peer.metadata.name ?? null}
        isBusy={busyTopic === selected?.topic}
        onConfirm={handleConfirm}
        onClose={() => setSelected(null)}
      />
    </YStack>
  )
}
