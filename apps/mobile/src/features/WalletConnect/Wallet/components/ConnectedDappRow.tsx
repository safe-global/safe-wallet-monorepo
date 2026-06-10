import React, { useCallback, useRef } from 'react'
import { Pressable } from 'react-native'
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable'
import { Text, View, XStack } from 'tamagui'
import type { SessionTypes } from '@walletconnect/types'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import type { VerifyVariant } from '../utils/verifyStatus'
import { DappIcon } from './DappIcon'
import { VerifyStatusIcon } from './VerifyStatusIcon'
import type { MenuAnchor } from './ConnectedDappContextMenu'

interface Props {
  session: SessionTypes.Struct
  variant?: VerifyVariant
  /** Opens the overflow menu for this session, anchored at the tapped point. */
  onOpenMenu: (session: SessionTypes.Struct, anchor: MenuAnchor) => void
  /** Asks the screen to open the disconnect confirmation for this session. */
  onRequestDisconnect: (session: SessionTypes.Struct) => void
}

/**
 * One connected-dApp card: brand icon with a verify badge overlay, the dApp name, and a 3-dots
 * trigger. The overflow menu is owned by the screen (so only one opens at a time); a left-swipe
 * reveals a destructive trash action that hands the session back to the screen to confirm.
 */
export const ConnectedDappRow: React.FC<Props> = ({ session, variant, onOpenMenu, onRequestDisconnect }) => {
  const meta = session.peer.metadata
  const swipeRef = useRef<SwipeableMethods>(null)

  const requestDisconnect = useCallback(() => {
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
    <ReanimatedSwipeable ref={swipeRef} renderRightActions={renderTrash} overshootRight={false}>
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
            <View position="absolute" bottom={-8} right={-8}>
              <VerifyStatusIcon variant={variant} size={16} />
            </View>
          ) : null}
        </View>
        <Text flex={1} fontWeight="600" fontSize={14} numberOfLines={1}>
          {meta.name}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={(e) => onOpenMenu(session, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
          accessibilityLabel={`Options for ${meta.name}`}
          testID={`connected-dapp-menu-${session.topic}`}
        >
          <SafeFontIcon name="options-horizontal" color="$colorSecondary" />
        </Pressable>
      </XStack>
    </ReanimatedSwipeable>
  )
}
