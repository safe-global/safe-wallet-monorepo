import type { LucideIcon } from 'lucide-react'

export interface SidebarItemConfig {
  icon: LucideIcon
  label: string
  href: string
  badge?: number | string
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
  safeCount: number
}

export interface SpaceSelectorProps {
  spaceInitial?: string
  selectedSpace?: SpaceItem
  spaces?: SpaceItem[]
  onSpaceAdded?: (space: SpaceItem) => void
}

export type SidebarVariantContentProps = SpaceSelectorProps & {
  isLoading?: boolean
}

export interface SafeWorkspaceHeaderBackToSpace {
  variant: 'backToSpace'
  spaceName: string
  spaceInitial?: string
  spaceId: string
}

export interface SafeWorkspaceHeaderAddToWorkspace {
  variant: 'addToWorkspace'
  selectedSpace?: SpaceItem
  spaces?: SpaceItem[]
  onSpaceAdded?: (space: SpaceItem) => void
}

export type SafeWorkspaceHeaderProps = SafeWorkspaceHeaderBackToSpace | SafeWorkspaceHeaderAddToWorkspace

export interface SafeSidebarVariantProps {
  workspaceHeader: SafeWorkspaceHeaderProps
  mainNavItems: ResolvedSidebarItem[] | null
  defiGroup: ResolvedSidebarGroup | null
  isLoading?: boolean
}
