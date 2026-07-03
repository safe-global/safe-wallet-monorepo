import { useState } from 'react'
import Link from 'next/link'
import { RotateCw, TriangleAlert } from 'lucide-react'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { AppRoutes } from '@/config/routes'
import { isMultiChainSafeItem } from '@/hooks/safes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { SpaceSummary } from '../SpaceCard'
import SpaceContextMenu from '../SpaceCard/SpaceContextMenu'
import SafeCardReadOnly from '../SafeAccounts/SafeCardReadOnly'
import { isUserActiveAdmin } from '@/features/spaces/utils'
import { useSpaceSafesById } from '../../hooks/useSpaceSafes'

/**
 * A single workspace row in the welcome "Workspaces" table. Collapsed it shows
 * the workspace name and its member/account counts; expanded (by clicking the
 * row) it lazily loads and lists the workspace's safes. The "Open" link
 * navigates into the workspace; admins get a context menu to rename/remove it.
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
  const [expanded, setExpanded] = useState(false)
  const { allSafes, isLoading, isError, refetch } = useSpaceSafesById(space.uuid, { skip: !expanded })
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
      <div data-testid="space-row">
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
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
          </button>

          <Link
            href={{ pathname: AppRoutes.spaces.index, query: { spaceId: space.uuid } }}
            onClick={handleOpenWorkspace}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
          >
            Open
          </Link>

          {/* Wrapper neutralizes the menu button's `align-self: start` (from the SpaceCard grid). */}
          {isAdmin && (
            <div className="shrink-0">
              <SpaceContextMenu space={space} />
            </div>
          )}
        </div>

        {expanded && (
          <div className="flex flex-col gap-2 pb-3">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full rounded-3xl" />
                <Skeleton className="h-16 w-full rounded-3xl" />
              </>
            ) : isError ? (
              <button
                type="button"
                onClick={refetch}
                className="flex items-center gap-2 self-start rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <TriangleAlert className="size-4" />
                <RotateCw className="size-3.5" />
                Failed to load accounts. Retry
              </button>
            ) : allSafes.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No accounts in this workspace yet.</p>
            ) : (
              allSafes.map((safe) => (
                <SafeCardReadOnly
                  key={isMultiChainSafeItem(safe) ? `multi-${safe.address}` : `${safe.chainId}:${safe.address}`}
                  safe={safe}
                  hideContextMenu
                  showPending={false}
                />
              ))
            )}
          </div>
        )}
      </div>
      {showDivider && <Separator />}
    </>
  )
}

export default SpaceRow
