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
import { SAFE_ACCOUNTS_LIMIT, SPACES_LIMIT } from '@/features/spaces/constants'
import css from '../../styles.module.css'
import type { SpaceItem } from '../../types'
import { truncateSpaceName } from '../../utils'
import { useAddSafeToSpace } from '../../hooks/useAddSafeToSpace'
import { useSafeAddressFromUrl, useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import useChainId from '@/hooks/useChainId'
import { isUserActiveAdmin } from '@/features/spaces/utils'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AdminOnlyWorkspaceTooltip } from '@/features/spaces/components/AdminOnlyWorkspaceTooltip'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getDeterministicColor } from '@/utils/colors'

export const SAFE_ALREADY_IN_WORKSPACE_TOOLTIP = 'Safe is already in this workspace'

const MENU_ITEM_CLASS = 'gap-3 min-h-9 px-2 py-2'

interface SpaceSelectorDropdownProps {
  selectedSpace?: SpaceItem
  spaces?: SpaceItem[]
  triggerVariant?: 'default' | 'addToWorkspace'
  onSpaceAdded?: (space: SpaceItem) => void
}

export const SpaceSelectorDropdown = ({
  selectedSpace,
  spaces = [],
  triggerVariant = 'default',
  onSpaceAdded,
}: SpaceSelectorDropdownProps): ReactElement => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const spaceName = selectedSpace?.name ?? ''
  const displayName = truncateSpaceName(spaceName, SPACE_SELECTOR_NAME_MAX_LENGTH)
  const initial = spaceName.charAt(0).toUpperCase()
  const selectedSpaceColor = spaceName ? getDeterministicColor(spaceName) : undefined
  const triggerAriaLabel = triggerVariant === 'addToWorkspace' ? 'Add Safe to workspace' : 'Open workspace selector'
  const safe = useSafeQueryParam() || undefined
  const safeAddress = useSafeAddressFromUrl()
  const chainId = useChainId()

  const { addToSpace, loadingSpaceId } = useAddSafeToSpace({ spaces, onSpaceAdded })
  const spaceId = selectedSpace?.uuid
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isSignedIn })

  const spaceColors = useMemo(
    () => Object.fromEntries(spaces.map((s) => [s.uuid, getDeterministicColor(s.name)])),
    [spaces],
  )

  const handleSelectSpace = async (targetSpaceId: string) => {
    if (triggerVariant === 'addToWorkspace') {
      const success = await addToSpace(targetSpaceId)
      if (success) setIsOpen(false)
    } else {
      const targetSpace = spaces.find((s) => s.uuid === targetSpaceId)
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_SWITCHED, label: targetSpaceId },
        {
          from_workspace_id: selectedSpace?.uuid,
          to_workspace_id: targetSpaceId,
          source: 'sidebar',
          safe_count: targetSpace?.safeCount ?? 0,
        },
      )
      router.push({
        pathname: router.pathname,
        query: { ...router.query, spaceId: targetSpaceId },
      })
    }
  }

  const handleCreateSpace = () => {
    trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.SIDEBAR })
    router.push(safe ? { pathname: AppRoutes.spaces.createSpace, query: { safe } } : AppRoutes.spaces.createSpace)
  }

  const handleViewSpaces = () => {
    trackEvent({ ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.space_selector })
    router.push(AppRoutes.welcome.spaces)
  }

  const isAddToWorkspace = triggerVariant === 'addToWorkspace'

  const isAtSafeLimit = (space: SpaceItem) => isAddToWorkspace && space.safeCount >= SAFE_ACCOUNTS_LIMIT
  const isAdminOfSpace = (space: SpaceItem) => isUserActiveAdmin(space.members ?? [], currentUser?.id)

  const renderSpaceMenuItem = (space: SpaceItem) => {
    const isAdmin = isAdminOfSpace(space)
    const atSafeLimit = isAtSafeLimit(space)
    const spaceColor = spaceColors[space.uuid]

    return (
      <SpaceMenuRow
        key={space.uuid}
        space={space}
        spaceColor={spaceColor}
        isAdmin={isAdmin}
        atSafeLimit={atSafeLimit}
        isAddToWorkspace={isAddToWorkspace}
        isSelected={selectedSpace?.uuid === space.uuid}
        loadingSpaceId={loadingSpaceId}
        chainId={chainId}
        safeAddress={safeAddress}
        isOpen={isOpen}
        isSignedIn={isSignedIn}
        onSelect={() => void handleSelectSpace(space.uuid)}
      />
    )
  }

  const handleOpenChange = (open: boolean) => {
    if (open && triggerVariant === 'addToWorkspace') {
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
            className={triggerVariant === 'addToWorkspace' ? css.addSafeToWorkspaceTrigger : css.spaceSelector}
            data-testid={triggerVariant === 'addToWorkspace' ? 'add-safe-to-workspace-button' : 'space-selector-button'}
            aria-label={triggerAriaLabel}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
          />
        }
      >
        {triggerVariant === 'addToWorkspace' ? (
          <>
            <span className={css.addSafeToWorkspaceRing}>
              <CircleFadingPlus className={css.addSafeToWorkspacePlusIcon} strokeWidth={2.5} />
            </span>
            <span className={css.addSafeToWorkspaceLabel}>Add Safe to workspace</span>
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
              {spaceName ? (
                <Tooltip>
                  <TooltipTrigger render={<span className={css.spaceSelectorName} />}>{displayName}</TooltipTrigger>
                  <TooltipContent side="top">{spaceName}</TooltipContent>
                </Tooltip>
              ) : (
                <span className={css.spaceSelectorName} />
              )}
              <span className={css.spaceSelectorSubtitle}>Workspace</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0" aria-hidden />
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
        {selectedSpace && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar className={css.spaceSelectorAvatar}>
              <AvatarFallback
                className={css.spaceSelectorAvatarFallback}
                style={{ backgroundColor: selectedSpaceColor }}
              >
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className={css.textSmallBold}>{selectedSpace.name}</div>
              <div className={css.textMini}>Workspace</div>
            </div>
          </div>
        )}

        {triggerVariant === 'default' ? <DropdownMenuSeparator /> : null}

        {spaces.map((space) => renderSpaceMenuItem(space))}

        <DropdownMenuSeparator className="my-1" />

        {(() => {
          const isAtSpacesLimit = spaces.length >= SPACES_LIMIT
          const addSpaceMenuItem = (
            <DropdownMenuItem onClick={handleCreateSpace} disabled={isAtSpacesLimit} className={MENU_ITEM_CLASS}>
              <Plus className={`size-5 flex-shrink-0 ${css.dropdownIcon}`} />
              <span>Add new workspace</span>
            </DropdownMenuItem>
          )

          if (!isAtSpacesLimit) return addSpaceMenuItem

          return (
            <Tooltip key="add-space-tooltip">
              <TooltipTrigger render={<div className="block w-full" />}>{addSpaceMenuItem}</TooltipTrigger>
              <TooltipContent side="right">Limit of {SPACES_LIMIT} workspaces reached</TooltipContent>
            </Tooltip>
          )
        })()}

        <DropdownMenuItem onClick={handleViewSpaces} className={MENU_ITEM_CLASS}>
          <LayoutGrid className={`size-5 flex-shrink-0 ${css.dropdownIcon}`} />
          <span>View all</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface SpaceMenuRowProps {
  space: SpaceItem
  spaceColor: string | undefined
  isAdmin: boolean
  atSafeLimit: boolean
  isAddToWorkspace: boolean
  isSelected: boolean
  loadingSpaceId: string | null
  chainId: string
  safeAddress: string
  isOpen: boolean
  isSignedIn: boolean
  onSelect: () => void
}

const SpaceMenuRow = ({
  space,
  spaceColor,
  isAdmin,
  atSafeLimit,
  isAddToWorkspace,
  isSelected,
  loadingSpaceId,
  chainId,
  safeAddress,
  isOpen,
  isSignedIn,
  onSelect,
}: SpaceMenuRowProps): ReactElement => {
  // Only check membership while the dropdown is open AND the user is signed in
  // AND we have a safe/chain to check against. RTK Query caches the result via
  // keepUnusedDataFor, so reopening within the cache window is free.
  const shouldCheckMembership = isOpen && isAddToWorkspace && isSignedIn && Boolean(safeAddress) && Boolean(chainId)
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query({ spaceId: space.uuid }, { skip: !shouldCheckMembership })

  const isAlreadyAdded = useMemo(() => {
    if (!shouldCheckMembership || !spaceSafes) return false
    return spaceSafes.safes[chainId]?.some((addr) => sameAddress(addr, safeAddress)) ?? false
  }, [shouldCheckMembership, spaceSafes, chainId, safeAddress])

  const isDisabled = loadingSpaceId !== null || (isAddToWorkspace && (!isAdmin || atSafeLimit || isAlreadyAdded))

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
      {loadingSpaceId === space.uuid ? (
        <Loader2 className="ml-auto size-4 animate-spin" />
      ) : isSelected ? (
        <Check className="ml-auto size-4" />
      ) : null}
    </DropdownMenuItem>
  )

  if (!isAddToWorkspace) return menuItem

  if (isAlreadyAdded) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div className="block w-full" />}>{menuItem}</TooltipTrigger>
        <TooltipContent side="right">{SAFE_ALREADY_IN_WORKSPACE_TOOLTIP}</TooltipContent>
      </Tooltip>
    )
  }

  if (!isAdmin) {
    return <AdminOnlyWorkspaceTooltip isAdmin={false}>{menuItem}</AdminOnlyWorkspaceTooltip>
  }

  if (atSafeLimit) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="block w-full" />}>{menuItem}</TooltipTrigger>
        <TooltipContent side="right">{`You can have up to ${SAFE_ACCOUNTS_LIMIT} Safes per workspace`}</TooltipContent>
      </Tooltip>
    )
  }

  return menuItem
}
