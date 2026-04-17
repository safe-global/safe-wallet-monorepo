import { type MouseEvent } from 'react'
import { Bookmark } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useMultiAccountItemData, usePinActions } from '@/features/myAccounts'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { Skeleton } from '@/components/ui/skeleton'
import type { MultiChainSafeItem } from '@/hooks/safes'
import {
  ICON_SIZE,
  SafeIdenticon,
  StackedChainLogos,
  NameSourceIcon,
  CopyAddressButton,
  SimilarityBadge,
  ShortAddressWithTooltip,
} from './shared'
import PinnedSafeContextMenu from './PinnedSafeContextMenu'

interface MultiSafeItemCardProps {
  item: MultiChainSafeItem
  isSimilar?: boolean
}

const MultiSafeItemCard = ({ item, isSimilar }: MultiSafeItemCardProps) => {
  const currency = useAppSelector(selectCurrency)
  const { address, sortedSafes, safeOverviews, sharedSetup, totalFiatValue, name } = useMultiAccountItemData(item)
  const addressBookItem = useAddressBookItem(address, sortedSafes[0]?.chainId)
  const { addToPinnedList, removeFromPinnedList } = usePinActions(address, name, sortedSafes, safeOverviews)
  const chainId = sortedSafes[0]?.chainId ?? ''
  const resolvedName = useSafeDisplayName(address, chainId, name)
  const displayName = resolvedName || shortenAddress(address)
  const isTotalLoading = totalFiatValue === undefined
  const isPinned = item.isPinned

  const handleTogglePin = (e: MouseEvent) => {
    e.stopPropagation()
    if (isPinned) {
      removeFromPinnedList()
    } else {
      addToPinnedList()
    }
  }

  return (
    <div className="rounded-md border border-border bg-card mb-2 overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-3 hover:bg-muted/30 transition-colors">
        <div className="flex flex-1 min-w-0 items-center gap-3">
          {/* Avatar with threshold overlay */}
          <div className="relative shrink-0">
            <SafeIdenticon address={address} size={ICON_SIZE} />
            {sharedSetup && sharedSetup.threshold > 0 && (
              <span className="absolute -bottom-1 -right-1.5 flex items-center justify-center rounded-sm bg-background text-foreground text-[9px] font-bold leading-none px-[3px] py-px border border-border shadow-sm whitespace-nowrap">
                {sharedSetup.threshold}/{sharedSetup.owners.length}
              </span>
            )}
          </div>

          {/* Name + address */}
          <div className="flex min-w-0 w-[160px] shrink-0 flex-col gap-0.5 overflow-hidden">
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
              {addressBookItem?.name && addressBookItem.source && <NameSourceIcon source={addressBookItem.source} />}
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <ShortAddressWithTooltip address={address} />
              <CopyAddressButton address={address} />
            </div>
            {isSimilar && <SimilarityBadge />}
          </div>

          {/* Stacked chain logos */}
          <div className="mx-auto shrink-0">
            <StackedChainLogos safes={sortedSafes} />
          </div>

          {/* Balance */}
          <div className="flex w-[70px] shrink-0 items-center justify-end mr-2">
            {isTotalLoading ? (
              <Skeleton className="h-3 w-12" />
            ) : totalFiatValue !== undefined ? (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatCurrency(totalFiatValue, currency)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Pin/Unpin toggle */}
        <button
          type="button"
          onClick={handleTogglePin}
          className="shrink-0 rounded p-1 hover:bg-muted"
          aria-label={isPinned ? 'Unpin safe' : 'Pin safe'}
        >
          <Bookmark className={`size-4 ${isPinned ? 'fill-foreground text-foreground' : 'text-muted-foreground'}`} />
        </button>

        {/* Context menu */}
        <PinnedSafeContextMenu address={address} chainId={sortedSafes[0]?.chainId ?? ''} name={displayName} />
      </div>
    </div>
  )
}

export default MultiSafeItemCard
