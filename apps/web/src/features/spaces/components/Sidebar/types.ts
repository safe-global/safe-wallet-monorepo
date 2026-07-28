import type { LucideIcon } from 'lucide-react'
import type { SpaceMemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

interface SidebarItemBase {
  icon: LucideIcon
  label: string
  badge?: number | string
}

export interface SidebarItemConfig extends SidebarItemBase {
  href: string
  isActive?: boolean
  activeMemberOnly?: boolean
}

/** A config entry that runs an action instead of navigating (e.g. a dev-only dialog). */
export interface SidebarActionItemConfig extends SidebarItemBase {
  /** Stable identity and test-id seed; action items have no route to be keyed by. */
  id: string
}

export interface SidebarGroupConfig {
  label: string
  items: SidebarItemConfig[]
}

export interface SidebarActionGroupConfig {
  label: string
  items: SidebarActionItemConfig[]
}

interface ResolvedSidebarItemBase extends SidebarItemBase {
  isActive: boolean
  disabled: boolean
  /** Renders a warning dot on the icon (e.g. Settings when the Safe is outdated). */
  indicator?: boolean
  /** Overrides the default data-testid (used by items rendered outside the config-driven list). */
  testId?: string
}

export interface ResolvedSidebarNavItem extends ResolvedSidebarItemBase {
  href: string
  link: { pathname: string; query: { spaceId?: string | null; safe?: string } }
  onSelect?: never
}

export interface ResolvedSidebarActionItem extends ResolvedSidebarItemBase {
  id: string
  onSelect: () => void
  href?: never
  link?: never
}

export type ResolvedSidebarItem = ResolvedSidebarNavItem | ResolvedSidebarActionItem

export interface ResolvedSidebarGroup {
  label: string
  items: ResolvedSidebarNavItem[]
}

export interface ResolvedSidebarActionGroup {
  label: string
  items: ResolvedSidebarActionItem[]
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
  mainNavItems: ResolvedSidebarNavItem[] | null
  defiGroup: ResolvedSidebarGroup | null
  developerGroup?: ResolvedSidebarActionGroup | null
  isLoading?: boolean
}
