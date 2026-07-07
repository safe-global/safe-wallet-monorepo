import { Clock, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

/**
 * `3/5` owners pill, shared by the accounts table and the safe selector dropdown.
 * Renders icon-only when the setup is unknown or mixed across chains.
 */
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

/** `N · Pending` badge for queued transactions. `compact` renders a clock icon + count instead. */
export function PendingBadge({
  count,
  loading = false,
  compact = false,
}: {
  count: number
  loading?: boolean
  compact?: boolean
}) {
  if (loading) return <Skeleton className="h-5 w-16 rounded-full" />
  if (count <= 0) return null

  return (
    <span
      data-testid="account-pending"
      className={cn(
        'bg-muted text-muted-foreground inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs',
        compact && 'gap-1',
      )}
    >
      {compact ? (
        <>
          <Clock className="size-3.5" />
          {count}
        </>
      ) : (
        `${count} · Pending`
      )}
    </span>
  )
}
