import React from 'react'
import { Pressable } from 'react-native'
import { MenuAction, MenuView, NativeActionEvent } from '@react-native-menu/menu'
import { useTheme } from '@/src/theme/hooks/useTheme'

type FloatingMenuProps = {
  onPressAction: (event: NativeActionEvent) => void
  actions: MenuAction[]
  children: React.ReactNode
}
export const FloatingMenu = ({ onPressAction, actions, children }: FloatingMenuProps) => {
  const { themePreference } = useTheme()

  return (
    <MenuView
      themeVariant={themePreference}
      onPressAction={onPressAction}
      actions={actions}
      shouldOpenOnLongPress={false}
    >
      <Pressable testID={'settings-screen-header-more-settings-button'}>{children}</Pressable>
    </MenuView>
  )
}
