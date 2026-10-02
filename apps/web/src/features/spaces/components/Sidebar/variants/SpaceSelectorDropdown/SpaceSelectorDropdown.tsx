import { useId, useMemo, useState, type ReactElement } from 'react'
import { Check, ChevronsUpDown, Plus, CircleFadingPlus, LayoutGrid, Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
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
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { WorkspaceCreateEntryPoint } from '@/services/analytics/mixpanel-events'
import { cn } from '@/utils/cn'
import { SPACE_SELECTOR_NAME_MAX_LENGTH } from '../../constants'
import { SPACES_LIMIT } from '@/features/spaces/constants'
import css from '../../styles.module.css'
import type { SpaceItem } from '../../types'
import { getAddToSpaceStatus, truncateSpaceName, type AddToSpaceStatus } from '../../utils'
import { useAddSafeToSpace } from '../../hooks/useAddSafeToSpace'
import { useSafeAddressFromUrl, useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import useChainId from '@/hooks/useChainId'
import { isUserActiveAdmin } from '@/features/spaces/utils'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { AdminOnlyWorkspaceTooltip } from '../../../AdminOnlyWorkspaceTooltip'
import { getDeterministicColor } from '@/utils/colors'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useSpacePlan } from '../../../../hooks/useSpacePlan'
import { useSpacesSafeEligibility } from '../../../../hooks/useSpacesSafeEligibility'
import { TRIAL_ENDING_SOON_DAYS, trialLabel } from '../../../../hooks/billing/subscription'
import { useIsSafeProPlansV2Enabled } from '../../../../hooks/useIsSafeProPlansV2Enabled'
import { StatusDot } from '../../../Plans/v2/StatusDot'

export const SAFE_ALREADY_IN_WORKSPACE_TOOLTIP = 'Safe is already in this Workspace'
export const NO_PLAN_TOOLTIP = 'Choose a plan for this Workspace to add Safe accounts'

const safeLimitMessage = (limit: number, isSafePro: boolean): string =>
  isSafePro
    ? `Your plan covers ${limit} Safe account${maybePlural(limit)}, and all are in use. Upgrade to add more.`
    : `You can have up to ${limit} Safes per Workspace`

const MENU_ITEM_CLASS = 'cursor-pointer gap-3 min-h-9 px-2 py-2'

interface SpaceSelectorDropdownProps {
  selectedSpace?: SpaceItem
  spaces?: SpaceItem[]
  triggerVariant?: 'default' | 'addToWorkspace'
}

export const SpaceSelectorDropdown = ({
  selectedSpace,
  spaces = [],
  triggerVariant = 'default',
}: SpaceSelectorDropdownProps): ReactElement => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const spaceName = selectedSpace?.name ?? ''
  const isSafePro = useIsSafeProEnabled()
  const { tierName, isTrialing, isTrialEndingSoon, plan } = useSpacePlan()
  const isPlansV2 = useIsSafeProPlansV2Enabled()
  const planLabel = !isSafePro
    ? 'Workspace'
    : isTrialing
      ? trialLabel(plan?.daysLeft, isPlansV2 ? TRIAL_ENDING_SOON_DAYS : undefined)
      : tierName
  const displayName = truncateSpaceName(spaceName, SPACE_SELECTOR_NAME_MAX_LENGTH)
  const initial = spaceName.charAt(0).toUpperCase()
  const selectedSpaceColor = spaceName ? getDeterministicColor(spaceName) : undefined
  const isAddToWorkspace = triggerVariant === 'addToWorkspace'
  const triggerAriaLabel = isAddToWorkspace ? 'Add Safe to Workspace' : 'Open Workspace selector'
  const safe = useSafeQueryParam() || undefined
  const safeAddress = useSafeAddressFromUrl()
  const chainId = useChainId()

  const { addToSpace, loadingSpaceId } = useAddSafeToSpace()
  const spaceId = selectedSpace?.uuid
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isSignedIn })

  const shouldCheckEligibility = isOpen && isAddToWorkspace && isSignedIn && Boolean(safeAddress) && Boolean(chainId)
  const eligibility = useSpacesSafeEligibility(shouldCheckEligibility)

  const spaceColors = useMemo(
    () => Object.fromEntries(spaces.map((s) => [s.uuid, getDeterministicColor(s.name)])),
    [spaces],
  )

  const switchToSpace = (targetSpace: SpaceItem) => {
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_SWITCHED, label: targetSpace.uuid },
      {
        from_workspace_id: selectedSpace?.uuid,
        to_workspace_id: targetSpace.uuid,
        source: 'sidebar',
        safe_count: targetSpace.safeCount,
      },
    )
    router.push({
      pathname: router.pathname,
      query: { ...router.query, spaceId: targetSpace.uuid },
    })
  }

  const addSafeToSpace = async (targetSpace: SpaceItem) => {
    const success = await addToSpace(targetSpace.uuid)
    if (success) setIsOpen(false)
  }

  const handleCreateSpace = () => {
    trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.SIDEBAR })
    // eslint-disable-next-line no-restricted-syntax -- The Workspace to create does not exist yet
    router.push(safe ? { pathname: AppRoutes.spaces.createSpace, query: { safe } } : AppRoutes.spaces.createSpace)
  }

  const handleViewSpaces = () => {
    trackEvent({ ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.space_selector })
    router.push(AppRoutes.welcome.spaces)
  }

  const isAdminOfSpace = (space: SpaceItem) => isUserActiveAdmin(space.members ?? [], currentUser?.id)

  const renderSpaceMenuItem = (space: SpaceItem) => {
    const limit = eligibility.getLimit(space.uuid)
    const status: AddToSpaceStatus = isAddToWorkspace
      ? getAddToSpaceStatus({
          spaceSafes: eligibility.getSafes(space.uuid),
          safeCount: space.safeCount,
          limit,
          hasPlan: eligibility.hasPlan(space.uuid),
          isAdmin: isAdminOfSpace(space),
          chainId,
          safeAddress,
        })
      : 'available'
    const isSelectable = status === 'available' || status === 'alreadyAdded'
    const isDisabled = loadingSpaceId !== null || (isAddToWorkspace && (eligibility.isLoading || !isSelectable))
    // A Workspace that holds the Safe already only opens it there
    const takesSafe = isAddToWorkspace && status !== 'alreadyAdded'

    return (
      <SpaceMenuRow
        key={space.uuid}
        space={space}
        spaceColor={spaceColors[space.uuid]}
        isSelected={selectedSpace?.uuid === space.uuid}
        isAdding={loadingSpaceId === space.uuid}
        isDisabled={isDisabled}
        status={status}
        limitMessage={typeof limit === 'number' ? safeLimitMessage(limit, isSafePro) : undefined}
        onSelect={() => (takesSafe ? void addSafeToSpace(space) : switchToSpace(space))}
      />
    )
  }

  const handleOpenChange = (open: boolean) => {
    if (open && isAddToWorkspace) {
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_SAFE_LINK_STARTED, label: spaceId },
        { workspace_id: spaceId, entry_point: 'sidebar' },
      )
    }
    setIsOpen(open)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
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
                  !isSafePro || isPlansV2
                    ? 'text-muted-foreground'
                    : isTrialEndingSoon
                      ? 'text-warning-strong'
                      : 'text-green-500',
                )}
              >
                {isSafePro && isPlansV2 && <StatusDot isWarning={isTrialEndingSoon} className="mr-1.5 align-middle" />}
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
        {spaces.map((space) => renderSpaceMenuItem(space))}

        <DropdownMenuSeparator className="my-1" />

        <AddWorkspaceMenuItem isAtSpacesLimit={spaces.length >= SPACES_LIMIT} onClick={handleCreateSpace} />

        <DropdownMenuItem onClick={handleViewSpaces} className={MENU_ITEM_CLASS}>
          <LayoutGrid className={`size-5 flex-shrink-0 ${css.dropdownIcon}`} />
          <span>View all</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const AddWorkspaceMenuItem = ({
  isAtSpacesLimit,
  onClick,
}: {
  isAtSpacesLimit: boolean
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
      <TooltipContent side="right">Limit of {SPACES_LIMIT} Workspaces reached</TooltipContent>
    </Tooltip>
  )
}

interface SpaceMenuRowProps {
  space: SpaceItem
  spaceColor: string | undefined
  isSelected: boolean
  isAdding: boolean
  isDisabled: boolean
  status: AddToSpaceStatus
  /** Set whenever the status is `safeLimit`. */
  limitMessage: string | undefined
  onSelect: () => void
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
