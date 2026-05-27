import React, { useState } from 'react'
import { Alert, FlatList, Pressable } from 'react-native'
import { Image, Text, XStack, YStack } from 'tamagui'
import { getSdkError } from '@walletconnect/utils'
import type { SessionTypes } from '@walletconnect/types'
import { useToastController } from '@tamagui/toast'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectSessions, removeSession } from '../store/walletKitSlice'
import { getWalletKit } from '../walletKit'

export const ConnectedDappsScreen: React.FC = () => {
  const sessions = useAppSelector(selectSessions)
  const dispatch = useAppDispatch()
  const toast = useToastController()
  const [busyTopic, setBusyTopic] = useState<string | null>(null)

  const onDisconnect = (session: SessionTypes.Struct) => {
    Alert.alert('Disconnect dApp?', `Disconnect from ${session.peer.metadata.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          setBusyTopic(session.topic)
          try {
            const wk = await getWalletKit()
            await wk.disconnectSession({
              topic: session.topic,
              reason: getSdkError('USER_DISCONNECTED'),
            })
            dispatch(removeSession(session.topic))
            toast.show(`${session.peer.metadata.name} disconnected`, { native: false, duration: 2500 })
          } catch (e) {
            toast.show(e instanceof Error ? e.message : 'Failed to disconnect', {
              native: false,
              duration: 2500,
            })
          } finally {
            setBusyTopic(null)
          }
        },
      },
    ])
  }

  return (
    <YStack flex={1} padding="$4">
      <Text fontWeight="600" marginBottom="$3">
        Connected apps
      </Text>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.topic}
        renderItem={({ item }) => {
          const meta = item.peer.metadata
          return (
            <Pressable onPress={() => onDisconnect(item)} disabled={busyTopic === item.topic}>
              <XStack gap="$3" padding="$3" alignItems="center">
                {meta.icons?.[0] ? (
                  <Image source={{ uri: meta.icons[0] }} width={32} height={32} borderRadius="$2" />
                ) : (
                  <YStack width={32} height={32} borderRadius="$2" backgroundColor="$backgroundSecondary" />
                )}
                <YStack flex={1}>
                  <Text fontWeight="500">{meta.name}</Text>
                  <Text color="$colorSecondary" numberOfLines={1}>
                    {meta.url}
                  </Text>
                </YStack>
              </XStack>
            </Pressable>
          )
        }}
        ListEmptyComponent={<Text color="$colorSecondary">No connected apps.</Text>}
      />
    </YStack>
  )
}
