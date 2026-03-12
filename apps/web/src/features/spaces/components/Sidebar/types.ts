import type { LucideIcon } from 'lucide-react'

export interface SidebarItemConfig {
  icon: LucideIcon
  label: string
  href: string
  badge?: number
  isActive?: boolean
  activeMemberOnly?: boolean
}

export interface SidebarGroupConfig {
  label: string
  items: SidebarItemConfig[]
}

export interface ResolvedSidebarItem extends Omit<SidebarItemConfig, 'isActive' | 'activeMemberOnly'> {
  isActive: boolean
  disabled: boolean
  link: { pathname: string; query: { spaceId?: string | null; safe?: string } }
}

export interface ResolvedSidebarGroup {
  label: string
  items: ResolvedSidebarItem[]
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

export interface SafeSidebarVariantProps extends SpaceSelectorProps {
  mainNavItems: ResolvedSidebarItem[]
  defiGroup: ResolvedSidebarGroup
}
