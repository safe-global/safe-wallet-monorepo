import type { ReactNode } from 'react'
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

export interface SidebarGroupConfig {
  label: string
  items: SidebarItemConfig[]
}

/** Everything a developer entry resolves for itself on each render. */
export interface SidebarDeveloperItemState {
  badge?: number | string
  onSelect: () => void
  /** UI the entry owns, e.g. the dialog it opens. Hosted inside the entry's own list element. */
  dialog?: ReactNode
}

/**
 * A dev-only entry that runs an action instead of navigating. Its badge, action and dialog all come
 * from its own `useItemState` hook, so entries never share state and adding one is a config-only change.
 */
export interface SidebarDeveloperItemConfig extends Pick<SidebarItemBase, 'icon' | 'label'> {
  /** Stable identity and test-id seed; developer entries have no route to be keyed by. */
  id: string
  useItemState: () => SidebarDeveloperItemState
}

export interface SidebarDeveloperGroupConfig {
  label: string
  items: SidebarDeveloperItemConfig[]
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
  isLoading?: boolean
}
