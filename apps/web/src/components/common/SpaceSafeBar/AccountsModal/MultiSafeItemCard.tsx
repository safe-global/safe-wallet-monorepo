import { type MouseEvent, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useMultiAccountItemData, usePinActions } from '@/features/myAccounts'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import type { MultiChainSafeItem } from '@/hooks/safes'
import {
  ICON_SIZE,
  SafeIdenticon,
  StackedChainLogos,
  NameSourceIcon,
  CopyAddressButton,
  ShortAddressWithTooltip,
} from './shared'
import { PinnedSafeSubItem } from './PinnedSafeItem'
import PinnedSafeContextMenu from './PinnedSafeContextMenu'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { SimilarityFlag } from '@/features/address-poisoning'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

interface MultiSafeItemCardProps {
  item: MultiChainSafeItem
  match?: SimilarityMatch
  /** True when the match is against another safe in this list (not a trusted anchor) — tunes the tooltip copy. */
  intraList?: boolean
  onClose: () => void
  openSafeTrackingLabel?: OVERVIEW_LABELS
}

const MultiSafeItemCard = ({
  item,
  match,
  intraList,
  onClose,
  openSafeTrackingLabel = OVERVIEW_LABELS.top_bar,
}: MultiSafeItemCardProps) => {
  const [open, setOpen] = useState(false)
  const currency = useAppSelector(selectCurrency)
  const { address, sortedSafes, safeOverviews, sharedSetup, totalFiatValue, name } = useMultiAccountItemData(item)
  const addressBookItem = useAddressBookItem(address, sortedSafes[0]?.chainId)
  const { addToPinnedList, removeFromPinnedList } = usePinActions(address, name, sortedSafes, safeOverviews)
  const chainId = sortedSafes[0]?.chainId ?? ''
  const resolvedName = useSafeDisplayName(address, chainId, name)
  const displayName = resolvedName || shortenAddress(address)
  const isTotalLoading = totalFiatValue === undefined
  const isPinned = item.isPinned

  const handleOpenChange = (next: boolean) => {
    if (next && !open) {
      trackEvent({ ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE, label: openSafeTrackingLabel })
    }
    setOpen(next)
  }

  const handleTogglePin = (e: MouseEvent) => {
    e.stopPropagation()
    if (isPinned) {
      removeFromPinnedList()
    } else {
      addToPinnedList()
    }
  }

  const handleNavigate = () => {
    trackEvent({ ...OVERVIEW_EVENTS.OPEN_SAFE, label: openSafeTrackingLabel })
    onClose()
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <div className="rounded-lg mb-1 overflow-hidden" data-testid="safe-item-card">
        <div className="flex items-center gap-1 px-3 py-3 hover:bg-muted/30 transition-colors">
          <CollapsibleTrigger className="flex flex-1 min-w-0 cursor-pointer items-center gap-3 text-left">
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
              <SimilarityFlag match={match} intraList={intraList} />
              <div className="flex items-center gap-1 min-w-0">
                <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
                {addressBookItem?.name && addressBookItem.source && <NameSourceIcon source={addressBookItem.source} />}
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <ShortAddressWithTooltip address={address} similarity={match} />
                <CopyAddressButton address={address} />
              </div>
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
          </CollapsibleTrigger>

          {/* Pin/Unpin toggle — outside trigger so it doesn't toggle the collapsible */}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className="shrink-0 cursor-pointer rounded p-1 hover:bg-muted"
                  aria-label={isPinned ? 'Unpin safe' : 'Pin safe'}
                />
              }
            >
              <Bookmark
                className={`size-4 ${isPinned ? 'fill-foreground text-foreground' : 'text-muted-foreground'}`}
              />
            </TooltipTrigger>
            <TooltipContent>{isPinned ? 'Remove from trusted Safes' : 'Add to trusted Safes'}</TooltipContent>
          </Tooltip>

          {/* Context menu — outside trigger for the same reason */}
          <PinnedSafeContextMenu address={address} chainId={sortedSafes[0]?.chainId ?? ''} name={displayName} />
        </div>

        <CollapsibleContent>
          <div className="pb-2 pl-2 pr-3">
            {sortedSafes.map((safeItem) => (
              <PinnedSafeSubItem
                key={`${safeItem.chainId}:${safeItem.address}`}
                safeItem={safeItem}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default MultiSafeItemCard
