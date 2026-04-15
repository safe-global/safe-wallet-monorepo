import { type MouseEvent, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useMultiAccountItemData } from '@/features/myAccounts'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { usePinActions } from '@/features/myAccounts'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import type { MultiChainSafeItem } from '@/hooks/safes'
import { ICON_SIZE, SafeIdenticon, StackedChainLogos, NameSourceIcon, CopyAddressButton } from './shared'
import { PinnedSafeSubItem } from './PinnedSafeItem'
import PinnedSafeContextMenu from './PinnedSafeContextMenu'

interface PinnedMultiSafeItemProps {
  item: MultiChainSafeItem
  onNavigate?: () => void
}

const PinnedMultiSafeItem = ({ item, onNavigate }: PinnedMultiSafeItemProps) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (next && !open) {
      trackEvent({ ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE, label: OVERVIEW_LABELS.top_bar })
    }
    setOpen(next)
  }
  const currency = useAppSelector(selectCurrency)
  const { address, sortedSafes, safeOverviews, sharedSetup, totalFiatValue, name } = useMultiAccountItemData(item)
  const addressBookItem = useAddressBookItem(address, sortedSafes[0]?.chainId)
  const { removeFromPinnedList } = usePinActions(address, name, sortedSafes, safeOverviews)
  const displayName = name ?? shortenAddress(address)
  const isTotalLoading = totalFiatValue === undefined

  const handleUnpin = (e: MouseEvent) => {
    e.stopPropagation()
    removeFromPinnedList()
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      {/* overflow-hidden so hover bg respects rounded-xl corners */}
      <div className="rounded-md border border-border bg-card mb-2 overflow-hidden">
        {/* Hoverable header row — same hover as single-chain card */}
        <div className="flex items-center gap-1 px-3 py-3 hover:bg-muted/30 transition-colors">
          {/* Collapsible trigger covers the main content area */}
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

            {/* Name + address — capped so chain icons don't crowd the right edge */}
            <div className="flex min-w-0 w-[160px] shrink-0 flex-col gap-0.5 overflow-hidden">
              <div className="flex items-center gap-1 min-w-0">
                <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
                {addressBookItem?.name && addressBookItem.source && <NameSourceIcon source={addressBookItem.source} />}
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="truncate text-xs text-muted-foreground">{shortenAddress(address)}</span>
                <CopyAddressButton address={address} />
              </div>
            </div>

            {/* Chain logos — centered between name and balance via equal margins */}
            <div className="mx-auto shrink-0">
              <StackedChainLogos safes={sortedSafes} />
            </div>

            {/* Balance — fixed width so chain icon alignment is consistent */}
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

          {/* Unpin — outside trigger so it doesn't toggle the collapsible */}
          <button
            type="button"
            onClick={handleUnpin}
            className="shrink-0 rounded p-1 hover:bg-muted"
            aria-label="Unpin safe"
          >
            <Bookmark className="size-4 fill-foreground text-foreground" />
          </button>

          {/* Context menu — outside trigger for the same reason */}
          <PinnedSafeContextMenu address={address} chainId={sortedSafes[0]?.chainId ?? ''} name={displayName} />
        </div>

        <CollapsibleContent>
          <div className="pb-2 pl-[52px] pr-3">
            {sortedSafes.map((safeItem) => (
              <PinnedSafeSubItem
                key={`${safeItem.chainId}:${safeItem.address}`}
                safeItem={safeItem}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default PinnedMultiSafeItem
