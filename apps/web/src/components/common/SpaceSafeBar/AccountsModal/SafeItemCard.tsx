import { type MouseEvent } from 'react'
import { Bookmark } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { useAppDispatch, useAppSelector } from '@/store'
import { pinSafe, unpinSafe } from '@/store/addedSafesSlice'
import { selectCurrency } from '@/store/settingsSlice'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, PIN_SAFE_LABELS } from '@/services/analytics/events/overview'
import { useSafeItemData } from '@/features/myAccounts'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { Skeleton } from '@/components/ui/skeleton'
import type { SafeItem } from '@/hooks/safes'
import {
  ICON_SIZE,
  SafeIdenticon,
  ChainLogo,
  NameSourceIcon,
  ReadOnlyBadge,
  NotActivatedBadge,
  CopyAddressButton,
} from './shared'
import PinnedSafeContextMenu from './PinnedSafeContextMenu'

interface SafeItemCardProps {
  safeItem: SafeItem
}

const SafeItemCard = ({ safeItem }: SafeItemCardProps) => {
  const dispatch = useAppDispatch()
  const currency = useAppSelector(selectCurrency)
  const { name, safeOverview, threshold, owners, elementRef, undeployedSafe, isActivating } = useSafeItemData(safeItem)
  const addressBookItem = useAddressBookItem(safeItem.address, safeItem.chainId)
  const displayName = name ?? shortenAddress(safeItem.address)
  const hasOverview = safeOverview !== undefined

  const handleTogglePin = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (safeItem.isPinned) {
      dispatch(unpinSafe({ chainId: safeItem.chainId, address: safeItem.address }))
      dispatch(
        showNotification({
          title: 'Safe removed',
          message: displayName,
          groupKey: `unpin-safe-${safeItem.address}`,
          variant: 'success',
        }),
      )
      trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.unpin })
    } else {
      dispatch(pinSafe({ chainId: safeItem.chainId, address: safeItem.address }))
      dispatch(
        showNotification({
          title: 'Safe trusted',
          message: displayName,
          groupKey: `pin-safe-${safeItem.address}`,
          variant: 'success',
        }),
      )
      trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.pin })
    }
  }

  return (
    <div
      ref={elementRef}
      className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-3 mb-2 hover:bg-muted/30 transition-colors"
    >
      <div className="flex flex-1 min-w-0 items-center gap-3">
        {/* Avatar with threshold overlay */}
        <div className="relative shrink-0">
          <SafeIdenticon address={safeItem.address} size={ICON_SIZE} />
          {threshold > 0 && owners.length > 0 && (
            <span className="absolute -bottom-1 -right-1.5 flex items-center justify-center rounded bg-background text-foreground text-[9px] font-bold leading-none px-[3px] py-px border border-border shadow-sm whitespace-nowrap">
              {threshold}/{owners.length}
            </span>
          )}
        </div>

        {/* Name + address + optional status badge */}
        <div className="flex min-w-0 w-[160px] shrink-0 flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-1 min-w-0">
            <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
            {addressBookItem?.name && addressBookItem.source && <NameSourceIcon source={addressBookItem.source} />}
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <span className="truncate text-xs text-muted-foreground">{shortenAddress(safeItem.address)}</span>
            <CopyAddressButton address={safeItem.address} />
          </div>
          {undeployedSafe && <NotActivatedBadge isActivating={isActivating} />}
          {!undeployedSafe && safeItem.isReadOnly && <ReadOnlyBadge />}
        </div>

        {/* Chain logo */}
        <div className="mx-auto shrink-0">
          <ChainLogo chainId={safeItem.chainId} />
        </div>

        {/* Balance */}
        <div className="flex w-[70px] shrink-0 items-center justify-end mr-2">
          {!hasOverview && !undeployedSafe ? (
            <Skeleton className="h-3 w-12" />
          ) : safeOverview?.fiatTotal !== undefined ? (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {formatCurrency(safeOverview.fiatTotal, currency)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Pin/Unpin toggle */}
      <button
        type="button"
        onClick={handleTogglePin}
        className="shrink-0 rounded p-1 hover:bg-muted"
        aria-label={safeItem.isPinned ? 'Unpin safe' : 'Pin safe'}
      >
        <Bookmark
          className={`size-4 ${safeItem.isPinned ? 'fill-foreground text-foreground' : 'text-muted-foreground'}`}
        />
      </button>

      {/* Context menu */}
      <PinnedSafeContextMenu address={safeItem.address} chainId={safeItem.chainId} name={displayName} />
    </div>
  )
}

export default SafeItemCard
