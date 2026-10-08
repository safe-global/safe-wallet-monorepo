import { useMemo, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { WorkspaceCreateEntryPoint } from '@/services/analytics/mixpanel-events'
import { SPACE_SELECTOR_NAME_MAX_LENGTH } from '@views/features/spaces/components/Sidebar/constants'
import { SPACES_LIMIT } from '@/features/spaces/constants'
import type { SpaceItem } from '@views/features/spaces/components/Sidebar/types'
import { getAddToSpaceStatus, truncateSpaceName, type AddToSpaceStatus } from '../../utils'
import { useAddSafeToSpace } from '../../hooks/useAddSafeToSpace'
import { useSafeAddressFromUrl, useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import useChainId from '@/hooks/useChainId'
import { isUserActiveAdmin } from '@/features/spaces/utils'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { getDeterministicColor } from '@/utils/colors'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useSpacePlan } from '../../../../hooks/useSpacePlan'
import { useSpacesSafeEligibility } from '../../../../hooks/useSpacesSafeEligibility'
import { trialLabel } from '../../../../hooks/billing/subscription'
import {
  SpaceSelectorDropdownView,
  type SpaceSelectorRow,
} from '@views/features/spaces/components/Sidebar/variants/SpaceSelectorDropdown/SpaceSelectorDropdownView'

export {
  SAFE_ALREADY_IN_WORKSPACE_TOOLTIP,
  NO_PLAN_TOOLTIP,
} from '@views/features/spaces/components/Sidebar/variants/SpaceSelectorDropdown/SpaceSelectorDropdownView'

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
  const spaceName = selectedSpace?.name ?? ''
  const isSafePro = useIsSafeProEnabled()
  const { tierName, isTrialing, isTrialEndingSoon, plan } = useSpacePlan()
  const displayName = truncateSpaceName(spaceName, SPACE_SELECTOR_NAME_MAX_LENGTH)
  const isAddToWorkspace = triggerVariant === 'addToWorkspace'
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

  const toRow = (space: SpaceItem): SpaceSelectorRow => {
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

    return {
      space,
      spaceColor: spaceColors[space.uuid],
      isSelected: selectedSpace?.uuid === space.uuid,
      isAdding: loadingSpaceId === space.uuid,
      isDisabled,
      status,
      limit: typeof limit === 'number' ? limit : undefined,
      onSelect: () => (takesSafe ? void addSafeToSpace(space) : switchToSpace(space)),
    }
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
    <SpaceSelectorDropdownView
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      isAddToWorkspace={isAddToWorkspace}
      spaceName={spaceName}
      displayName={displayName}
      isSafePro={isSafePro}
      isTrialing={isTrialing}
      trialLabel={isTrialing ? trialLabel(plan?.daysLeft) : undefined}
      tierName={tierName}
      isTrialEndingSoon={isTrialEndingSoon}
      rows={spaces.map(toRow)}
      isAtSpacesLimit={spaces.length >= SPACES_LIMIT}
      spacesLimit={SPACES_LIMIT}
      onCreateSpace={handleCreateSpace}
      onViewSpaces={handleViewSpaces}
    />
  )
}
