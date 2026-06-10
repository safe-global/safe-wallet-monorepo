import React from 'react'
import { Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
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

/**
 * Right-aligns the menu to the tapped point and flips it above the tap when anchoring below
 * would run it off the bottom of the window, so the action stays on-screen on the last rows.
 */
export const getMenuPlacement = (
  anchor: MenuAnchor,
  window: { width: number; height: number },
  menuHeight: number = MENU_HEIGHT_ESTIMATE,
): MenuPlacement => {
  const right = Math.max(GUTTER, window.width - anchor.x)
  const overflowsBottom = anchor.y + GAP + menuHeight > window.height
  return overflowsBottom ? { right, bottom: window.height - anchor.y + GAP } : { right, top: anchor.y + GAP }
}

/**
 * Overflow menu for a connected-dApp row, rendered in a full-window Modal so a tap anywhere
 * outside dismisses it and only one can be open at a time (the screen owns its single state).
 * Positioned against the tapped point rather than measured layout to stay simple and testable.
 */
export const ConnectedDappContextMenu: React.FC<Props> = ({ anchor, onDisconnect, onClose, testID }) => {
  const window = useWindowDimensions()
  const placement = getMenuPlacement(anchor, window)

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Close menu">
        <YStack
          position="absolute"
          top={placement.top}
          bottom={placement.bottom}
          right={placement.right}
          width={MENU_WIDTH}
          backgroundColor="$errorBackground"
          borderRadius="$2"
          overflow="hidden"
        >
          <Pressable onPress={onDisconnect} testID={testID}>
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
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
})
