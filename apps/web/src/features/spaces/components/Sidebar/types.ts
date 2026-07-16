import type { LucideIcon } from 'lucide-react'
import type { SpaceMemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

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
  /** Renders a warning dot on the icon (e.g. Settings when the Safe is outdated). */
  indicator?: boolean
  /** Overrides the default data-testid (used by items rendered outside the config-driven list). */
  testId?: string
  link: { pathname: string; query: { spaceId?: string | null; safe?: string } }
}

export interface ResolvedSidebarGroup {
  label: string
  items: ResolvedSidebarItem[]
}

export interface SpaceItem {
  uuid: string
  name: string
  safeCount: number
  // Optional only for fixtures; always present from the API.
  members?: SpaceMemberDto[]
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
  developerGroup?: ResolvedSidebarGroup | null
  isLoading?: boolean
}
