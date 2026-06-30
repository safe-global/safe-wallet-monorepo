import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import AddressWithCopy from '@/components/common/AddressWithCopy'
import Track from '@/components/common/Track'
import { FiatBalance } from '@/features/spaces'
import { AccountItem as BaseAccountItem } from '../AccountItem'
import { AddNetworkButton } from '../AddNetworkButton'
import { useMultiAccountItemData } from '../../hooks/useMultiAccountItemData'
import { useSafeItemData } from '../../hooks/useSafeItemData'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import type { MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import { SAFE_TABLE_GRID } from './constants'
import { ThresholdBadge } from './ThresholdBadge'

const SubRow = ({
  safeItem,
  safeOverview,
  onLinkClick,
}: {
  safeItem: SafeItem
  safeOverview?: SafeOverview
  onLinkClick?: () => void
}) => {
  const { chain, href, elementRef, trackingLabel, isCurrentSafe, undeployedSafe, isActivating, threshold, owners } =
    useSafeItemData(safeItem, { safeOverview })

  const hasQueuedItems =
    !safeItem.isReadOnly &&
    safeOverview &&
    ((safeOverview.queued ?? 0) > 0 || (safeOverview.awaitingConfirmation ?? 0) > 0)

  return (
    <Track {...OVERVIEW_EVENTS.OPEN_SAFE} label={trackingLabel}>
      <NextLink
        ref={elementRef as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={onLinkClick}
        className={cn(
          SAFE_TABLE_GRID,
          'border-muted hover:bg-muted/40 border-b px-4 py-2 transition-colors',
          isCurrentSafe && 'bg-muted/40',
        )}
      >
        {/* Account column — chain name, indented to sit under the parent name */}
        <div className="flex min-w-0 items-center gap-2 pl-10">
          <Typography variant="paragraph-small-medium" className="text-foreground truncate">
            {chain?.chainName ?? shortenAddress(safeItem.address)}
          </Typography>
          <BaseAccountItem.StatusChip
            isActivating={isActivating}
            isReadOnly={false}
            undeployedSafe={!!undeployedSafe}
          />
          {hasQueuedItems && (
            <BaseAccountItem.QueueActions
              safeAddress={safeOverview.address.value}
              chainShortName={chain?.shortName || ''}
              queued={safeOverview.queued ?? 0}
              awaitingConfirmation={safeOverview.awaitingConfirmation ?? 0}
            />
          )}
        </div>

        {/* Chains column — the single chain logo */}
        <div className="flex min-w-0 items-center">
          <BaseAccountItem.ChainBadge chainId={safeItem.chainId} />
        </div>

        {/* Balance column */}
        <div className="flex items-center justify-end">
          {safeOverview || undeployedSafe ? (
            <FiatBalance value={safeOverview?.fiatTotal} />
          ) : (
            <Skeleton className="h-4 w-16" />
          )}
        </div>

        {/* Threshold column */}
        <div className="flex items-center justify-end">
          <ThresholdBadge threshold={threshold} owners={owners.length} />
        </div>

        <span />
      </NextLink>
    </Track>
  )
}

type MultiChainSafeTableRowProps = {
  multiSafeAccountItem: MultiChainSafeItem
  onLinkClick?: () => void
  isSpaceSafe?: boolean
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  onRename?: () => void
  onAddToWorkspace?: () => void
  onBalanceResolved?: (value: number | undefined) => void
}

const MultiChainSafeTableRow = ({
  multiSafeAccountItem,
  onLinkClick,
  isSpaceSafe = false,
  selectable = false,
  selected = false,
  onToggleSelect,
  onRename,
  onAddToWorkspace,
  onBalanceResolved,
}: MultiChainSafeTableRowProps) => {
  const {
    address,
    name,
    sortedSafes,
    safeOverviews,
    totalFiatValue,
    hasReplayableSafe,
    isCurrentSafe,
    isReadOnly,
    sharedSetup,
    isWelcomePage,
    isSpaceRoute,
  } = useMultiAccountItemData(multiSafeAccountItem)

  const [expanded, setExpanded] = useState(isCurrentSafe)

  // Report the aggregated balance up so the table can sort by the same value it displays.
  useEffect(() => {
    onBalanceResolved?.(totalFiatValue)
  }, [totalFiatValue, onBalanceResolved])

  const trackingLabel = isWelcomePage ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar
  const displayName = multiSafeAccountItem.name || name || shortenAddress(address)

  const toggleExpand = () =>
    setExpanded((prev) => {
      if (!prev && !isSpaceRoute) {
        trackEvent({ ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE, label: trackingLabel })
      }
      return !prev
    })

  return (
    <div
      className={cn('border-muted border-b', isCurrentSafe && 'bg-muted/30', selected && 'bg-primary/5')}
      data-testid="safe-list-item"
    >
      <button
        type="button"
        onClick={selectable ? () => onToggleSelect?.() : toggleExpand}
        data-testid="multichain-item-summary"
        className={cn(
          SAFE_TABLE_GRID,
          'group hover:bg-muted/40 w-full cursor-pointer px-4 py-2 text-left transition-colors',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {selectable && (
            <Checkbox
              checked={selected}
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none"
              data-testid="select-safe-checkbox"
            />
          )}
          <span className="inline-flex shrink-0">
            <Identicon address={address} />
          </span>
          <div className="flex min-w-0 flex-col" data-testid="group-address">
            <div className="flex items-center gap-1">
              <Typography variant="paragraph-small-bold" className="text-foreground truncate">
                {displayName}
              </Typography>
              {onRename && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRename()
                  }}
                  className="text-muted-foreground hover:text-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Rename Safe"
                  data-testid="rename-safe-btn"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </div>
            <span onClick={(e) => e.stopPropagation()}>
              <AddressWithCopy address={address} full />
            </span>
          </div>
        </div>

        <div className="flex min-w-0 items-center">
          <BaseAccountItem.ChainBadge safes={sortedSafes} />
        </div>

        <div className="flex items-center justify-end" data-testid="group-balance">
          <FiatBalance value={totalFiatValue?.toString()} />
        </div>

        <div className="flex items-center justify-end">
          {sharedSetup ? <ThresholdBadge threshold={sharedSetup.threshold} owners={sharedSetup.owners.length} /> : null}
        </div>

        {!isSpaceSafe && onAddToWorkspace ? (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAddToWorkspace()
              }}
              data-testid="add-to-workspace-btn"
            >
              <Plus className="size-3.5" />
              Add to Workspace
            </Button>
          </div>
        ) : (
          <span />
        )}
      </button>

      {expanded && (
        <div data-testid="subacounts-container" className="bg-muted/20">
          {sortedSafes.map((safeItem) => {
            const overview = safeOverviews?.find(
              (o) => o.chainId === safeItem.chainId && sameAddress(o.address.value, safeItem.address),
            )
            return (
              <SubRow
                key={`${safeItem.chainId}:${safeItem.address}`}
                safeItem={safeItem}
                safeOverview={overview}
                onLinkClick={onLinkClick}
              />
            )
          })}

          {!isReadOnly && hasReplayableSafe && !isSpaceSafe && (
            <div className="flex items-center justify-center px-4 py-2">
              <AddNetworkButton
                currentName={multiSafeAccountItem.name ?? ''}
                safeAddress={address}
                deployedChains={sortedSafes.map((s) => s.chainId)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MultiChainSafeTableRow
