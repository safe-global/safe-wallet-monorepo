import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, RotateCw, TriangleAlert } from 'lucide-react'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { AppRoutes } from '@/config/routes'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import { isMultiChainSafeItem } from '@/hooks/safes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { SpaceSummary } from '../SpaceCard'
import SafeCardReadOnly from '../SafeAccounts/SafeCardReadOnly'
import { useSpaceSafesById } from '../../hooks/useSpaceSafes'

/**
 * A single workspace in the welcome "Workspaces" tab. Collapsed it shows the
 * workspace name and its member/account counts; expanded it lazily loads and
 * lists the workspace's safes as clickable rows that navigate into the safe.
 */
const SpaceRow = ({ space }: { space: GetSpaceResponse }) => {
  const [expanded, setExpanded] = useState(false)
  const isDarkMode = useDarkMode()
  const { allSafes, isLoading, isError, refetch } = useSpaceSafesById(space.uuid, { skip: !expanded })

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
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="w-full rounded-lg border bg-card" data-testid="space-row">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <InitialsAvatar name={space.name} size="medium" />
          <div className="min-w-0 flex-1">
            <SpaceSummary
              name={space.name}
              numberOfAccounts={space.safeCount}
              numberOfMembers={space.memberCount}
              isCompact
            />
          </div>
          <Link
            href={{ pathname: AppRoutes.spaces.index, query: { spaceId: space.uuid } }}
            onClick={(e) => {
              e.stopPropagation()
              handleOpenWorkspace()
            }}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
          >
            Open
          </Link>
          <ChevronDown
            className={cn('size-5 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
          />
        </button>

        {expanded && (
          <div className="flex flex-col gap-2 px-4 pb-4">
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
    </div>
  )
}

export default SpaceRow
