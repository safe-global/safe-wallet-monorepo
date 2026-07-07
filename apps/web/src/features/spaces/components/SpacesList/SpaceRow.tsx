import Link from 'next/link'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Separator } from '@/components/ui/separator'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { SpaceSummary } from '../SpaceCard'
import SpaceContextMenu from '../SpaceCard/SpaceContextMenu'
import { isUserActiveAdmin } from '@/features/spaces/utils'
import { cn } from '@/utils/cn'

/**
 * A single workspace row in the welcome "Workspaces" list, showing the
 * workspace name and its member/account counts. Clicking the row navigates
 * into the workspace; admins get a context menu to rename/remove it.
 */
const SpaceRow = ({
  space,
  currentUserId,
  showDivider = false,
}: {
  space: GetSpaceResponse
  currentUserId?: number
  showDivider?: boolean
}) => {
  const isAdmin = isUserActiveAdmin(space.members, currentUserId)

  const handleOpenWorkspace = () => {
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_SWITCHED, label: space.uuid },
      {
        from_workspace_id: undefined,
        to_workspace_id: space.uuid,
        source: 'space_selector',
        safe_count: space.safeCount,
      },
    )
  }

  return (
    <>
      <div data-testid="space-row" className="relative">
        <Link
          href={{ pathname: AppRoutes.spaces.index, query: { spaceId: space.uuid } }}
          onClick={handleOpenWorkspace}
          className={cn('flex items-center gap-3 py-3', isAdmin && 'pr-10')}
        >
          <InitialsAvatar name={space.name} size="medium" rounded />
          <div className="min-w-0 flex-1">
            <SpaceSummary
              name={space.name}
              numberOfAccounts={space.safeCount}
              numberOfMembers={space.memberCount}
              isCompact
            />
          </div>
        </Link>

        {isAdmin && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <SpaceContextMenu space={space} />
          </div>
        )}
      </div>
      {showDivider && <Separator />}
    </>
  )
}

export default SpaceRow
