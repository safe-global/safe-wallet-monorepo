import { Users } from 'lucide-react'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

const MAX_VISIBLE_WORKSPACES = 2

/** `3/5` owners pill. Multi-chain accounts with differing setups show the icon only. */
export function ThresholdBadge({
  threshold,
  owners,
  iconOnly = false,
  loading = false,
}: {
  threshold?: number
  owners?: number
  iconOnly?: boolean
  loading?: boolean
}) {
  if (loading) return <Skeleton className="h-5 w-10 rounded-full" />
  if (!iconOnly && (threshold == null || owners == null)) return null

  return (
    <span
      data-testid="account-threshold"
      className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
    >
      <Users className="size-3.5" />
      {iconOnly ? null : `${threshold}/${owners}`}
    </span>
  )
}

/** Overlapping stack of the workspaces a Safe belongs to, with a `+N` overflow bubble. */
export function WorkspaceAvatars({ spaces }: { spaces: GetSpaceResponse[] }) {
  if (spaces.length === 0) return null

  const visible = spaces.slice(0, MAX_VISIBLE_WORKSPACES)
  const overflow = spaces.length - visible.length

  return (
    <div
      data-testid="account-workspaces"
      className="flex -space-x-1.5"
      title={spaces.map((space) => space.name).join(', ')}
    >
      {visible.map((space) => (
        <span key={space.uuid} className="ring-background inline-flex rounded-full ring-2">
          <InitialsAvatar name={space.name} size="xsmall" rounded />
        </span>
      ))}
      {overflow > 0 && (
        <span className="bg-muted text-muted-foreground ring-background flex size-5 items-center justify-center rounded-full text-[10px] ring-2">
          +{overflow}
        </span>
      )}
    </div>
  )
}

/** `N · Pending` badge for queued transactions. */
export function PendingBadge({ count, loading = false }: { count: number; loading?: boolean }) {
  if (loading) return <Skeleton className="h-5 w-16 rounded-full" />
  if (count <= 0) return null

  return (
    <span
      data-testid="account-pending"
      className={cn('bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs')}
    >
      {count} · Pending
    </span>
  )
}
