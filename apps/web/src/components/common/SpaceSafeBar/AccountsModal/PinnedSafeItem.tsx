import Link from 'next/link'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import { useSafeItemData } from '@/features/myAccounts'
import { useChain } from '@/hooks/useChains'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { SafeItem } from '@/hooks/safes'
import { ChainLogo, ReadOnlyBadge, NotActivatedBadge } from './shared'

export interface PinnedSafeItemProps {
  safeItem: SafeItem
  onNavigate?: () => void
}

/** Compact sub-row used inside an expanded multi-chain group */
export function PinnedSafeSubItem({ safeItem, onNavigate }: PinnedSafeItemProps) {
  const currency = useAppSelector(selectCurrency)
  // elementRef gates `useGetSafeOverviewQuery` via IntersectionObserver — without it, fiatTotal/queued never load.
  const { href, safeOverview, undeployedSafe, isActivating, elementRef } = useSafeItemData(safeItem)
  const chain = useChain(safeItem.chainId)
  const hasOverview = safeOverview !== undefined
  const queuedCount = !undeployedSafe ? (safeOverview?.queued ?? 0) : 0

  const handleNavigate = () => {
    trackEvent({ ...OVERVIEW_EVENTS.OPEN_SAFE, label: OVERVIEW_LABELS.top_bar })
    onNavigate?.()
  }

  return (
    <div ref={elementRef}>
      <Link
        href={href}
        onClick={handleNavigate}
        className="flex items-center gap-3 rounded-md px-2 py-2 no-underline hover:bg-muted/30 transition-colors"
      >
        <ChainLogo chainId={safeItem.chainId} size={20} />

        {/* Chain name + optional per-network status badge */}
        <div className="flex flex-1 min-w-0 flex-col gap-0.5">
          <span className="text-xs font-medium text-foreground truncate">{chain?.chainName ?? safeItem.chainId}</span>
          {undeployedSafe && <NotActivatedBadge isActivating={isActivating} />}
          {!undeployedSafe && safeItem.isReadOnly && <ReadOnlyBadge />}
        </div>

        {queuedCount > 0 && (
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {queuedCount} pending
          </Badge>
        )}

        {!hasOverview && !undeployedSafe ? (
          <Skeleton className="h-3 w-10" />
        ) : safeOverview?.fiatTotal !== undefined ? (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatCurrency(safeOverview.fiatTotal, currency)}
          </span>
        ) : null}
      </Link>
    </div>
  )
}
