import React from 'react'
import { Pressable } from 'react-native'
import { MenuAction, MenuView, NativeActionEvent } from '@react-native-menu/menu'
import { ThemePreference } from '@/src/types/theme'

type FloatingMenuProps = {
  onPressAction: (event: NativeActionEvent) => void
  actions: MenuAction[]
  children: React.ReactNode
  themeVariant?: ThemePreference
}
export const FloatingMenu = ({ onPressAction, actions, children, themeVariant }: FloatingMenuProps) => {
  return (
    <MenuView themeVariant={themeVariant} onPressAction={onPressAction} actions={actions} shouldOpenOnLongPress={false}>
      <Pressable testID={'settings-screen-header-more-settings-button'}>{children}</Pressable>
    </MenuView>
  )
}
