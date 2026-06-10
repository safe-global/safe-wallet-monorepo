import React from 'react'
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Text, XStack } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export type MenuAnchor = { x: number; y: number }

interface Props {
  /** Window coordinates of the tap that opened the menu; the menu right-aligns to it. */
  anchor: MenuAnchor
  onDisconnect: () => void
  onClose: () => void
  testID?: string
}

const MENU_WIDTH = 200
const GUTTER = 16
const GAP = 8
// Single-item menu; enough to decide whether it would overflow the bottom edge.
const MENU_HEIGHT_ESTIMATE = 56

type MenuPlacement = { right: number; top?: number; bottom?: number }

/** Right-aligns the menu to the tapped point, flipping above it when anchoring below would run off the bottom. */
export const getMenuPlacement = (
  anchor: MenuAnchor,
  window: { width: number; height: number },
  menuHeight: number = MENU_HEIGHT_ESTIMATE,
): MenuPlacement => {
  const right = Math.max(GUTTER, window.width - anchor.x)
  const overflowsBottom = anchor.y + GAP + menuHeight > window.height
  return overflowsBottom ? { right, bottom: window.height - anchor.y + GAP } : { right, top: anchor.y + GAP }
}

/** Single-open overflow menu in a full-window Modal: outside taps dismiss, the menu itself stays. */
export const ConnectedDappContextMenu: React.FC<Props> = ({ anchor, onDisconnect, onClose, testID }) => {
  const window = useWindowDimensions()
  const placement = getMenuPlacement(anchor, window)

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
        {/* The whole menu is the press target so taps on its padding/corners don't reach the backdrop. */}
        <Pressable
          onPress={onDisconnect}
          testID={testID}
          style={[styles.menu, { top: placement.top, bottom: placement.bottom, right: placement.right }]}
        >
          <XStack
            backgroundColor="$errorBackground"
            borderRadius="$2"
            overflow="hidden"
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
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
  },
})
