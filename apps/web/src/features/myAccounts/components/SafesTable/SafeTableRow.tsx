import { useEffect } from 'react'
import NextLink from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import { Button } from '@/components/ui/button'
import AddressWithCopy from '@/components/common/AddressWithCopy'
import Track from '@/components/common/Track'
import { FiatBalance } from '@/features/spaces'
import { AccountItem as BaseAccountItem } from '../AccountItem'
import { useSafeItemData } from '../../hooks/useSafeItemData'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import type { SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Typography } from '@/components/ui/typography'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/utils/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SAFE_TABLE_GRID } from './constants'
import { ThresholdBadge } from './ThresholdBadge'

type SafeTableRowProps = {
  safeItem: SafeItem
  safeOverview?: SafeOverview
  onLinkClick?: () => void
  isSpaceSafe?: boolean
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  onRename?: () => void
  onAddToWorkspace?: () => void
  onBalanceResolved?: (value: number | undefined) => void
}

const SafeTableRow = ({
  safeItem,
  safeOverview: provided,
  onLinkClick,
  isSpaceSafe = false,
  selectable = false,
  selected = false,
  onToggleSelect,
  onRename,
  onAddToWorkspace,
  onBalanceResolved,
}: SafeTableRowProps) => {
  const {
    chain,
    name,
    href,
    safeOverview,
    isCurrentSafe,
    threshold,
    owners,
    undeployedSafe,
    elementRef,
    trackingLabel,
  } = useSafeItemData(safeItem, { safeOverview: provided, isSpaceSafe })

  const displayName = (isSpaceSafe ? safeItem.name : name) || shortenAddress(safeItem.address)

  const hasQueuedItems =
    !safeItem.isReadOnly &&
    safeOverview &&
    ((safeOverview.queued ?? 0) > 0 || (safeOverview.awaitingConfirmation ?? 0) > 0)

  // Report the resolved balance up so the table can sort by the same value it displays.
  useEffect(() => {
    onBalanceResolved?.(safeOverview ? Number(safeOverview.fiatTotal) : undefined)
  }, [safeOverview, onBalanceResolved])

  // Read-only chip intentionally omitted; undeployed safes are conveyed by greying the row + a
  // hover hint (rather than a "Not activated" chip that adds a second line and row height).
  const rowClass = cn(
    SAFE_TABLE_GRID,
    'group border-muted hover:bg-muted/40 border-b px-4 py-2 transition-colors',
    isCurrentSafe && 'bg-muted/30',
    selected && 'bg-primary/5',
    undeployedSafe && 'opacity-60',
  )

  const cells = (
    <>
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
          <Identicon address={safeItem.address} />
        </span>
        <div className="flex min-w-0 flex-col">
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
          <AddressWithCopy address={safeItem.address} full />
          {hasQueuedItems && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <BaseAccountItem.QueueActions
                safeAddress={safeOverview.address.value}
                chainShortName={chain?.shortName || ''}
                queued={safeOverview.queued ?? 0}
                awaitingConfirmation={safeOverview.awaitingConfirmation ?? 0}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 items-center">
        <BaseAccountItem.ChainBadge chainId={safeItem.chainId} />
      </div>

      <div className="flex items-center justify-end">
        <FiatBalance value={safeOverview?.fiatTotal} />
      </div>

      <div className="flex items-center justify-end">
        <ThresholdBadge threshold={threshold} owners={owners.length} />
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
    </>
  )

  // Undeployed safes get a fast app tooltip (the native `title` attribute has a ~1s browser delay).
  const withDeployTooltip = (node: React.ReactElement) =>
    undeployedSafe ? (
      <Tooltip>
        <TooltipTrigger render={node} />
        <TooltipContent>Safe not deployed</TooltipContent>
      </Tooltip>
    ) : (
      node
    )

  // In manage mode the row selects instead of navigating.
  if (selectable) {
    return withDeployTooltip(
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleSelect?.()}
        className={cn(rowClass, 'cursor-pointer text-left')}
        data-testid="safe-list-item"
      >
        {cells}
      </div>,
    )
  }

  return (
    <Track {...OVERVIEW_EVENTS.OPEN_SAFE} label={trackingLabel}>
      {withDeployTooltip(
        <NextLink
          ref={elementRef as React.Ref<HTMLAnchorElement>}
          href={href}
          onClick={onLinkClick}
          data-testid="safe-list-item"
          className={rowClass}
        >
          {cells}
        </NextLink>,
      )}
    </Track>
  )
}

export default SafeTableRow
