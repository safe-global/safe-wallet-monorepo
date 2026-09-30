import React from 'react'
import { Pressable } from 'react-native'
import { MenuAction, MenuView, NativeActionEvent } from '@react-native-menu/menu'
import { useTheme } from '@/src/theme/hooks/useTheme'

/**
 * iOS renders destructive menu items in its own system red and ignores titleColor/imageColor;
 * Android honors them, so we pass this matching value for destructive actions on both platforms.
 */
export const NATIVE_MENU_DESTRUCTIVE_COLOR = 'rgb(255,66,69)'

type FloatingMenuProps = {
  onPressAction: (event: NativeActionEvent) => void
  actions: MenuAction[]
  children: React.ReactNode
  testID?: string
  accessibilityLabel?: string
}
export const FloatingMenu = ({ onPressAction, actions, children, testID, accessibilityLabel }: FloatingMenuProps) => {
  const { themePreference } = useTheme()

  return (
    <MenuView
      themeVariant={themePreference}
      onPressAction={onPressAction}
      actions={actions}
      shouldOpenOnLongPress={false}
    >
      <Pressable testID={testID} accessibilityLabel={accessibilityLabel}>
        {children}
      </Pressable>
    </MenuView>
  )
}
