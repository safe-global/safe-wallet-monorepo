import type { LucideIcon } from 'lucide-react'

export interface SidebarItemConfig {
  icon: LucideIcon
  label: string
  href: string
  badge?: number
  isActive?: boolean
}

export interface SidebarGroupConfig {
  label: string
  items: SidebarItemConfig[]
}

export interface SpaceItem {
  id: number
  name: string
}

export interface SpaceSelectorProps {
  spaceName?: string
  spaceInitial?: string
  selectedSpace?: SpaceItem
  spaces?: SpaceItem[]
}
