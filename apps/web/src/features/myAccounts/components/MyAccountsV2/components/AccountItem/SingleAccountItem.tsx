import NextLink from 'next/link'
import Identicon from '@/components/common/Identicon'
import AddressWithCopy from '@/components/common/AddressWithCopy'
import Track from '@/components/common/Track'
import FiatBalance from '@/components/common/FiatBalance'
import { AccountItem as BaseAccountItem } from '../../../AccountItem'
import { useSafeItemData } from '../../../../hooks/useSafeItemData'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import type { SafeItem } from '@/hooks/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

type SingleAccountItemProps = {
  safeItem: SafeItem
  onLinkClick?: () => void
  isSpaceSafe?: boolean
}

const SingleAccountItem = ({ safeItem, onLinkClick, isSpaceSafe = false }: SingleAccountItemProps) => {
  const {
    chain,
    name,
    href,
    safeOverview,
    isCurrentSafe,
    isActivating,
    isReplayable,
    threshold,
    owners,
    undeployedSafe,
    elementRef,
    trackingLabel,
  } = useSafeItemData(safeItem, { isSpaceSafe })

  const displayName = (isSpaceSafe ? safeItem.name : name) || shortenAddress(safeItem.address)

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
        data-testid="safe-list-item"
        className={cn(
          'bg-card hover:bg-muted/50 flex w-full items-center justify-between gap-4 rounded-3xl border-2 py-4 pl-4 pr-6 transition-colors',
          isCurrentSafe ? 'border-primary/30' : 'border-card',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="inline-flex shrink-0">
            <Identicon address={safeItem.address} />
          </span>

          <div className="flex min-w-0 flex-col gap-1">
            <Typography variant="paragraph-medium" className="text-foreground truncate">
              {displayName}
            </Typography>
            <AddressWithCopy address={safeItem.address} />

            <div className="mt-1 flex flex-wrap items-center gap-1">
              <BaseAccountItem.StatusChip
                isActivating={isActivating}
                isReadOnly={safeItem.isReadOnly}
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
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <BaseAccountItem.ChainBadge chainId={safeItem.chainId} />
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <FiatBalance value={safeOverview?.fiatTotal} />
        </div>

        {!isSpaceSafe && (
          <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <BaseAccountItem.PinButton safeItem={safeItem} threshold={threshold} owners={owners} name={name} />
            <BaseAccountItem.ContextMenu
              address={safeItem.address}
              chainId={safeItem.chainId}
              name={name}
              isReplayable={isReplayable}
              undeployedSafe={!!undeployedSafe}
              hideNestedSafes
              onClose={onLinkClick}
            />
          </div>
        )}
      </NextLink>
    </Track>
  )
}

export default SingleAccountItem
