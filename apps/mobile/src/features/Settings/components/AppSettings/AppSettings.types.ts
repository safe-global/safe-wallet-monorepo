import { ReactNode } from 'react'

interface BaseSettingsItem {
  label: string
  leftIcon: string
  rightNode?: ReactNode
  disabled?: boolean
  tag?: string
}

export interface StaticSettingsItem extends BaseSettingsItem {
  type: 'switch' | 'floating-menu'
  rightNode: ReactNode
}

export interface PressableSettingsItem extends BaseSettingsItem {
  type?: 'menu' | 'external-link'
  onPress: () => void
}

export type SettingsItem = StaticSettingsItem | PressableSettingsItem

export interface SettingsSection {
  sectionName?: string
  items: SettingsItem[]
}
