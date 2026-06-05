import { type MouseEvent } from 'react'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { useAppDispatch, useAppSelector } from '@/store'
import { pinSafe, unpinSafe } from '@/store/addedSafesSlice'
import { selectCurrency } from '@/store/settingsSlice'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, PIN_SAFE_LABELS } from '@/services/analytics/events/overview'
import { useSafeItemData } from '@/features/myAccounts'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
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
  SimilarityBadge,
  ShortAddressWithTooltip,
} from './shared'
import PinnedSafeContextMenu from './PinnedSafeContextMenu'

interface SafeItemCardProps {
  safeItem: SafeItem
  isSimilar?: boolean
  onClose: () => void
  openSafeTrackingLabel?: OVERVIEW_LABELS
  hidePinControls?: boolean
}

const SafeItemCard = ({
  safeItem,
  isSimilar,
  onClose,
  openSafeTrackingLabel = OVERVIEW_LABELS.top_bar,
  hidePinControls = false,
}: SafeItemCardProps) => {
  const dispatch = useAppDispatch()
  const currency = useAppSelector(selectCurrency)
  const { name, safeOverview, threshold, owners, elementRef, undeployedSafe, isActivating, href } =
    useSafeItemData(safeItem)
  const addressBookItem = useAddressBookItem(safeItem.address, safeItem.chainId)
  const resolvedName = useSafeDisplayName(safeItem.address, safeItem.chainId, name)
  const displayName = resolvedName || shortenAddress(safeItem.address)
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

  const handleOpenSafeNav = () => {
    trackEvent({ ...OVERVIEW_EVENTS.OPEN_SAFE, label: openSafeTrackingLabel })
    onClose()
  }

  const mainContentClasses =
    'flex flex-1 min-w-0 items-center gap-3 text-foreground no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm'

  const mainContent = (
    <>
      {/* Avatar with threshold overlay */}
      <div className="relative shrink-0">
        <SafeIdenticon address={safeItem.address} size={ICON_SIZE} />
        {threshold > 0 && owners.length > 0 && (
          <span
            className="absolute -bottom-1 -right-1.5 flex items-center justify-center rounded bg-background text-foreground text-[9px] font-bold leading-none px-[3px] py-px border border-border shadow-sm whitespace-nowrap"
            data-testid="missing-signature-info"
          >
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
          <ShortAddressWithTooltip address={safeItem.address} isSimilar={isSimilar} />
          <CopyAddressButton address={safeItem.address} />
        </div>
        {isSimilar && <SimilarityBadge />}
        {undeployedSafe && <NotActivatedBadge isActivating={isActivating} />}
        {!undeployedSafe && safeItem.isReadOnly && !isSimilar && <ReadOnlyBadge />}
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
    </>
  )

  return (
    <div
      ref={elementRef}
      data-testid="safe-item-card"
      className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-3 mb-2 hover:bg-muted/30 transition-colors"
    >
      {href ? (
        <Link href={href} onClick={handleOpenSafeNav} className={mainContentClasses}>
          {mainContent}
        </Link>
      ) : (
        <div className={mainContentClasses}>{mainContent}</div>
      )}

      {!hidePinControls && (
        <>
          {/* Pin/Unpin toggle */}
          <button
            type="button"
            onClick={handleTogglePin}
            className="shrink-0 rounded p-1 hover:bg-muted"
            aria-label={safeItem.isPinned ? 'Unpin safe' : 'Pin safe'}
            data-testid="bookmark-icon"
          >
            <Bookmark
              className={`size-4 ${safeItem.isPinned ? 'fill-foreground text-foreground' : 'text-muted-foreground'}`}
            />
          </button>

          {/* Context menu */}
          <PinnedSafeContextMenu address={safeItem.address} chainId={safeItem.chainId} name={displayName} />
        </>
      )}
    </div>
  )
}

export default SafeItemCard
