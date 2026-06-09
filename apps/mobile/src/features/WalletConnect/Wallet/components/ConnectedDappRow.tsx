import React, { useCallback, useRef, useState } from 'react'
import { Pressable } from 'react-native'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { Text, View, XStack, YStack } from 'tamagui'
import type { SessionTypes } from '@walletconnect/types'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import type { VerifyVariant } from '../utils/verifyStatus'
import { DappIcon } from './DappIcon'
import { VerifyStatusIcon } from './VerifyStatusIcon'

interface Props {
  session: SessionTypes.Struct
  variant?: VerifyVariant
  /** Asks the screen to open the disconnect confirmation for this session. */
  onRequestDisconnect: (session: SessionTypes.Struct) => void
}

/**
 * One connected-dApp card: brand icon with a verify badge overlay, the dApp name, and a 3-dots
 * menu. The overflow menu and a left-swipe both reveal a single destructive "Disconnect" action
 * that hands the session back to the screen to confirm — matching the Figma flows.
 */
export const ConnectedDappRow: React.FC<Props> = ({ session, variant, onRequestDisconnect }) => {
  const meta = session.peer.metadata
  const swipeRef = useRef<Swipeable>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const requestDisconnect = useCallback(() => {
    setMenuOpen(false)
    swipeRef.current?.close()
    onRequestDisconnect(session)
  }, [onRequestDisconnect, session])

  const renderTrash = useCallback(
    () => (
      <View justifyContent="center" paddingLeft="$3">
        <Pressable
          onPress={requestDisconnect}
          accessibilityLabel={`Disconnect ${meta.name}`}
          testID={`connected-dapp-trash-${session.topic}`}
        >
          <View
            width={40}
            height={40}
            borderRadius={200}
            backgroundColor="$errorBackground"
            alignItems="center"
            justifyContent="center"
          >
            <SafeFontIcon name="delete" size={20} color="$error" />
          </View>
        </Pressable>
      </View>
    ),
    [requestDisconnect, meta.name, session.topic],
  )

  return (
    <YStack position="relative">
      <Swipeable ref={swipeRef} renderRightActions={renderTrash} overshootRight={false}>
        <XStack
          backgroundColor="$backgroundPaper"
          borderRadius="$2"
          padding="$3"
          gap="$3"
          alignItems="center"
          testID="connected-dapp-row"
        >
          <View width={40} height={40}>
            <DappIcon url={meta.icons?.[0]} size={40} />
            {variant ? (
              <View position="absolute" bottom={-2} right={-2}>
                <VerifyStatusIcon variant={variant} size={16} />
              </View>
            ) : null}
          </View>
          <Text flex={1} fontWeight="600" fontSize={14} numberOfLines={1}>
            {meta.name}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => setMenuOpen((open) => !open)}
            accessibilityLabel={`Options for ${meta.name}`}
            testID={`connected-dapp-menu-${session.topic}`}
          >
            <SafeFontIcon name="options-horizontal" color="$colorSecondary" />
          </Pressable>
        </XStack>
      </Swipeable>

      {menuOpen ? (
        <>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="Close menu"
          />
          <YStack
            position="absolute"
            top="$5"
            right="$3"
            width={200}
            backgroundColor="$errorBackground"
            borderRadius="$2"
            zIndex={1000}
            elevation={4}
          >
            <Pressable onPress={requestDisconnect} testID={`connected-dapp-disconnect-${session.topic}`}>
              <XStack
                paddingHorizontal="$4"
                paddingVertical="$4"
                gap="$2"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text color="$error" fontSize={16}>
                  Disconnect
                </Text>
                <SafeFontIcon name="delete" size={24} color="$error" />
              </XStack>
            </Pressable>
          </YStack>
        </>
      ) : null}
    </YStack>
  )
}
