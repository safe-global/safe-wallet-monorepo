import Link from 'next/link'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import IconButton from '@mui/material/IconButton'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Separator } from '@/components/ui/separator'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { SpaceSummary } from '../SpaceCard'
import SpaceContextMenu from '../SpaceCard/SpaceContextMenu'
import { AdminOnlyWorkspaceTooltip } from '../AdminOnlyWorkspaceTooltip'
import { isUserActiveAdmin } from '@/features/spaces/utils'

const MEMBER_NO_EDIT_MESSAGE = 'You need admin access to edit.'

/**
 * A single workspace row in the welcome "Workspaces" list, showing the
 * workspace name and its member/account counts. Clicking the row navigates
 * into the workspace; admins get a context menu to rename/remove it, while
 * members see a disabled menu with a tooltip explaining they lack access.
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
          className="flex items-center gap-3 py-3 pr-10"
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

        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <AdminOnlyWorkspaceTooltip isAdmin={isAdmin} side="left" message={MEMBER_NO_EDIT_MESSAGE}>
            {isAdmin ? (
              <SpaceContextMenu space={space} />
            ) : (
              <IconButton
                data-testid="space-row-locked-actions"
                size="small"
                disabled
                aria-label={MEMBER_NO_EDIT_MESSAGE}
              >
                <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
              </IconButton>
            )}
          </AdminOnlyWorkspaceTooltip>
        </div>
      </div>
      {showDivider && <Separator />}
    </>
  )
}

export default SpaceRow
