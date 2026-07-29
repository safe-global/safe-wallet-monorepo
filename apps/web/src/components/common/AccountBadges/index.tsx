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

/** Hover label for the pending badge: total queued, plus how many await the wallet's signature. */
export const formatPendingLabel = (count: number, awaitingConfirmation = 0): string => {
  const base = count === 1 ? '1 pending transaction' : `${count} pending transactions`
  return awaitingConfirmation > 0 ? `${base} · ${awaitingConfirmation} awaiting your confirmation` : base
}

/**
 * `N · Pending` badge for queued transactions. `compact` renders a clock icon + count instead.
 * When `awaitingConfirmation > 0`, an orange dot flags that some of those pending transactions
 * need the connected wallet's signature (the hover tooltip, owned by the caller, spells out how many).
 */
export function PendingBadge({
  count,
  awaitingConfirmation = 0,
  loading = false,
  compact = false,
}: {
  count: number
  awaitingConfirmation?: number
  loading?: boolean
  compact?: boolean
}) {
  if (loading) return <Skeleton className="h-5 w-16 rounded-full" />
  if (count <= 0) return null

  const needsConfirmation = awaitingConfirmation > 0

  return (
    <span
      data-testid="account-pending"
      className={cn(
        'bg-muted text-muted-foreground inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs',
        compact && 'gap-1',
        needsConfirmation && 'relative',
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
      {needsConfirmation && (
        <span
          data-testid="account-awaiting-confirmation"
          aria-label={`${awaitingConfirmation} awaiting your confirmation`}
          className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[var(--color-warning-main)] ring-1 ring-card"
        />
      )}
    </span>
  )
}
