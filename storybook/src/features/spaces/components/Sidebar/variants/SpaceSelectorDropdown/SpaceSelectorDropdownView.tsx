import { useId, type ReactElement } from 'react'
import { Check, ChevronsUpDown, Plus, CircleFadingPlus, LayoutGrid, Loader2 } from 'lucide-react'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import css from '@/features/spaces/components/Sidebar/styles.module.css'
import type { SpaceItem } from '@views/features/spaces/components/Sidebar/types'
import { AdminOnlyWorkspaceTooltip } from '@views/features/spaces/components/AdminOnlyWorkspaceTooltip'
import { getDeterministicColor } from '@/utils/colors'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export const SAFE_ALREADY_IN_WORKSPACE_TOOLTIP = 'Safe is already in this Workspace'
export const NO_PLAN_TOOLTIP = 'Choose a plan for this Workspace to add Safe accounts'

/** What selecting a Workspace does with the Safe (mirrors AddToSpaceStatus in the Sidebar utils). */
export type SpaceRowStatus = 'available' | 'alreadyAdded' | 'notAdmin' | 'noPlan' | 'safeLimit'

const safeLimitMessage = (limit: number, isSafePro: boolean): string =>
  isSafePro
    ? `Your plan covers ${limit} Safe account${maybePlural(limit)}, and all are in use. Upgrade to add more.`
    : `You can have up to ${limit} Safes per Workspace`

const MENU_ITEM_CLASS = 'cursor-pointer gap-3 min-h-9 px-2 py-2'

export type SpaceSelectorRow = {
  space: SpaceItem
  spaceColor: string | undefined
  isSelected: boolean
  isAdding: boolean
  isDisabled: boolean
  status: SpaceRowStatus
  limit: number | undefined
  onSelect: () => void
}

export type SpaceSelectorDropdownViewProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isAddToWorkspace: boolean
  spaceName: string
  displayName: string
  isSafePro: boolean
  isTrialing: boolean
  /** Trial copy for the plan subtitle, set while trialing. */
  trialLabel?: string
  tierName?: string
  isTrialEndingSoon: boolean
  rows: SpaceSelectorRow[]
  isAtSpacesLimit: boolean
  spacesLimit: number
  onCreateSpace: () => void
  onViewSpaces: () => void
}

export const SpaceSelectorDropdownView = ({
  isOpen,
  onOpenChange,
  isAddToWorkspace,
  spaceName,
  displayName,
  isSafePro,
  isTrialing,
  trialLabel,
  tierName,
  isTrialEndingSoon,
  rows,
  isAtSpacesLimit,
  spacesLimit,
  onCreateSpace,
  onViewSpaces,
}: SpaceSelectorDropdownViewProps): ReactElement => {
  const menuId = useId()
  const planLabel = !isSafePro ? 'Workspace' : isTrialing ? trialLabel : tierName
  const initial = spaceName.charAt(0).toUpperCase()
  const selectedSpaceColor = spaceName ? getDeterministicColor(spaceName) : undefined
  const triggerAriaLabel = isAddToWorkspace ? 'Add Safe to Workspace' : 'Open Workspace selector'

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className={isAddToWorkspace ? css.addSafeToWorkspaceTrigger : css.spaceSelector}
            data-testid={isAddToWorkspace ? 'add-safe-to-workspace-button' : 'space-selector-button'}
            aria-label={triggerAriaLabel}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
          />
        }
      >
        {isAddToWorkspace ? (
          <>
            <span className={css.addSafeToWorkspaceRing}>
              <CircleFadingPlus className={css.addSafeToWorkspacePlusIcon} />
            </span>
            <span className={css.addSafeToWorkspaceLabel}>Add Safe to Workspace</span>
          </>
        ) : (
          <>
            <Avatar className={css.spaceSelectorAvatar}>
              <AvatarFallback
                className={css.spaceSelectorAvatarFallback}
                style={selectedSpaceColor ? { backgroundColor: selectedSpaceColor } : undefined}
              >
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className={css.spaceSelectorText}>
              <span className="flex items-center gap-1">
                {spaceName ? (
                  <Tooltip>
                    <TooltipTrigger render={<span className={css.spaceSelectorName} />}>{displayName}</TooltipTrigger>
                    <TooltipContent side="top">{spaceName}</TooltipContent>
                  </Tooltip>
                ) : (
                  <span className={css.spaceSelectorName} />
                )}
              </span>
              <span
                className={cn(
                  css.spaceSelectorSubtitle,
                  'block truncate',
                  !isSafePro ? 'text-muted-foreground' : isTrialEndingSoon ? 'text-warning-strong' : 'text-green-500',
                )}
              >
                {planLabel}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" aria-hidden />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        id={menuId}
        side="bottom"
        align="start"
        className={css.spaceSelectorDropdownContent}
        data-testid="space-selector-menu"
      >
        <div className={cn(css.groupLabel, 'mb-1')}>Workspaces</div>
        {rows.map((row) => (
          <SpaceMenuRow
            key={row.space.uuid}
            {...row}
            limitMessage={typeof row.limit === 'number' ? safeLimitMessage(row.limit, isSafePro) : undefined}
          />
        ))}

        <DropdownMenuSeparator className="my-1" />

        <AddWorkspaceMenuItem isAtSpacesLimit={isAtSpacesLimit} spacesLimit={spacesLimit} onClick={onCreateSpace} />

        <DropdownMenuItem onClick={onViewSpaces} className={MENU_ITEM_CLASS}>
          <LayoutGrid className={`size-5 flex-shrink-0 ${css.dropdownIcon}`} />
          <span>View all</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const AddWorkspaceMenuItem = ({
  isAtSpacesLimit,
  spacesLimit,
  onClick,
}: {
  isAtSpacesLimit: boolean
  spacesLimit: number
  onClick: () => void
}): ReactElement => {
  const menuItem = (
    <DropdownMenuItem onClick={onClick} disabled={isAtSpacesLimit} className={MENU_ITEM_CLASS}>
      <Plus className={`size-5 flex-shrink-0 ${css.dropdownIcon}`} />
      <span>Add new Workspace</span>
    </DropdownMenuItem>
  )

  if (!isAtSpacesLimit) return menuItem

  return (
    <Tooltip>
      <TooltipTrigger render={<div className="block w-full" />}>{menuItem}</TooltipTrigger>
      <TooltipContent side="right">Limit of {spacesLimit} Workspaces reached</TooltipContent>
    </Tooltip>
  )
}

type SpaceMenuRowProps = Omit<SpaceSelectorRow, 'limit'> & {
  /** Set whenever the status is `safeLimit`. */
  limitMessage: string | undefined
}

const SpaceMenuRow = ({
  space,
  spaceColor,
  isSelected,
  isAdding,
  isDisabled,
  status,
  limitMessage,
  onSelect,
}: SpaceMenuRowProps): ReactElement => {
  const menuItem = (
    <DropdownMenuItem
      onClick={onSelect}
      disabled={isDisabled}
      className={cn(MENU_ITEM_CLASS, isSelected && css.navItemActive)}
    >
      <Avatar className={cn('size-8 shrink-0', css.spaceSelectorItemAvatar)}>
        <AvatarFallback className={css.spaceSelectorItemAvatarFallback} style={{ backgroundColor: spaceColor }}>
          {space.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1">{space.name}</span>
      {isAdding ? (
        <Loader2 className="ml-auto size-4 animate-spin" />
      ) : isSelected ? (
        <Check className="ml-auto size-4" />
      ) : null}
    </DropdownMenuItem>
  )

  switch (status) {
    case 'alreadyAdded':
      return <RowTooltip message={SAFE_ALREADY_IN_WORKSPACE_TOOLTIP}>{menuItem}</RowTooltip>
    case 'notAdmin':
      return <AdminOnlyWorkspaceTooltip isAdmin={false}>{menuItem}</AdminOnlyWorkspaceTooltip>
    case 'noPlan':
      return <RowTooltip message={NO_PLAN_TOOLTIP}>{menuItem}</RowTooltip>
    case 'safeLimit':
      return <RowTooltip message={limitMessage ?? ''}>{menuItem}</RowTooltip>
    case 'available':
      return menuItem
  }
}

const RowTooltip = ({ message, children }: { message: string; children: ReactElement }): ReactElement => (
  <Tooltip>
    <TooltipTrigger render={<span className="block w-full" />}>{children}</TooltipTrigger>
    <TooltipContent side="right">{message}</TooltipContent>
  </Tooltip>
)
