import { ReactNode } from 'react'

export interface SettingsItem {
  label: string
  leftIcon: string
  rightNode?: ReactNode
  onPress?: () => void
  disabled?: boolean
  type?: string
}

export interface SettingsSection {
  sectionName?: string
  items: SettingsItem[]
}
