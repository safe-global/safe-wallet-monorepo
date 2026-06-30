import type { Ref } from 'react'
import type { SelectableSafe } from './useTrustedSafesModal.types'
import { useSafeItemData, AccountItem } from '@/features/myAccounts'
import { FiatBalance } from '@/features/spaces'
import Identicon from '@/components/common/Identicon'
import AddressWithCopy from '@/components/common/AddressWithCopy'
import { Checkbox } from '@/components/ui/checkbox'
import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { cn } from '@/utils/cn'
import SimilarityWarning from './SimilarityWarning'
import { MODAL_SAFE_GRID } from './constants'
import { ThresholdBadge } from './ThresholdBadge'

interface TrustedSafesItemProps {
  safe: SelectableSafe
  onToggle: (address: string) => void
}

/**
 * Single safe row in the selection modal, laid out like the SafesTable rows for visual
 * consistency. The whole row toggles selection; the checkbox is purely visual.
 */
const TrustedSafesItem = ({ safe, onToggle }: TrustedSafesItemProps) => {
  const { chain, name, safeOverview, isActivating, threshold, owners, undeployedSafe, elementRef } =
    useSafeItemData(safe)

  const displayName = name || shortenAddress(safe.address)

  const hasQueuedItems =
    !safe.isReadOnly && safeOverview && ((safeOverview.queued ?? 0) > 0 || (safeOverview.awaitingConfirmation ?? 0) > 0)

  const showStatus = isActivating || !!undeployedSafe || !!hasQueuedItems

  return (
    <div
      ref={elementRef as Ref<HTMLDivElement>}
      role="button"
      tabIndex={0}
      onClick={() => onToggle(safe.address)}
      data-testid="safe-list-item"
      className={cn(
        MODAL_SAFE_GRID,
        'group border-muted hover:bg-muted/40 cursor-pointer border-b px-3 py-2 transition-colors',
        safe.isSelected && 'bg-primary/5',
      )}
    >
      <Checkbox
        checked={safe.isSelected}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none"
        data-testid={`safe-item-checkbox-${safe.address}`}
      />

      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex shrink-0">
          <Identicon address={safe.address} />
        </span>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <Typography variant="paragraph-small-bold" className="text-foreground truncate">
              {displayName}
            </Typography>
            {safe.similarityGroup && <SimilarityWarning />}
          </div>
          <AddressWithCopy address={safe.address} full />
          {showStatus && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <AccountItem.StatusChip
                isActivating={isActivating}
                isReadOnly={false}
                undeployedSafe={!!undeployedSafe}
              />
              {hasQueuedItems && (
                <AccountItem.QueueActions
                  safeAddress={safeOverview.address.value}
                  chainShortName={chain?.shortName || ''}
                  queued={safeOverview.queued ?? 0}
                  awaitingConfirmation={safeOverview.awaitingConfirmation ?? 0}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 items-center">
        <AccountItem.ChainBadge chainId={safe.chainId} />
      </div>

      <div className="flex items-center justify-end">
        <FiatBalance value={safeOverview?.fiatTotal} />
      </div>

      <div className="flex items-center justify-end">
        <ThresholdBadge threshold={threshold} owners={owners.length} />
      </div>
    </div>
  )
}

export default TrustedSafesItem
