import { useState } from 'react'
import NextLink from 'next/link'
import Identicon from '@/components/common/Identicon'
import { FiatBalance } from '@/features/spaces'
import MultiAccountContextMenu from '@/components/sidebar/SafeListContextMenu/MultiAccountContextMenu'
import { AccountItem as BaseAccountItem } from '../../../AccountItem'
import { AddNetworkButton } from '../../../AddNetworkButton'
import { useMultiAccountItemData } from '../../../../hooks/useMultiAccountItemData'
import { useSafeItemData } from '../../../../hooks/useSafeItemData'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import type { MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Typography } from '@/components/ui/typography'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import Track from '@/components/common/Track'
import { cn } from '@/utils/cn'

const SubItem = ({
  safeItem,
  safeOverview,
  onLinkClick,
}: {
  safeItem: SafeItem
  safeOverview?: SafeOverview
  onLinkClick?: () => void
}) => {
  const { chain, href, threshold, owners, elementRef, trackingLabel, isCurrentSafe, undeployedSafe, isActivating } =
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
          'hover:bg-muted/40 flex w-full items-center justify-between gap-4 rounded-2xl py-3 pl-4 pr-6 transition-colors',
          isCurrentSafe && 'bg-muted/50',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BaseAccountItem.Icon
            address={safeItem.address}
            chainId={safeItem.chainId}
            threshold={threshold}
            owners={owners.length}
            isMultiChainItem
          />
          <div className="flex min-w-0 flex-col gap-1">
            <Typography variant="paragraph-small-medium" className="text-foreground truncate">
              {chain?.chainName ?? shortenAddress(safeItem.address)}
            </Typography>
            <div className="flex flex-wrap items-center gap-1">
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

        <div className="flex shrink-0 items-center justify-end">
          {safeOverview || undeployedSafe ? (
            <FiatBalance value={safeOverview?.fiatTotal} />
          ) : (
            <Skeleton className="h-4 w-16" />
          )}
        </div>
      </NextLink>
    </Track>
  )
}

type MultiAccountItemProps = {
  multiSafeAccountItem: MultiChainSafeItem
  onLinkClick?: () => void
  isSpaceSafe?: boolean
}

const MultiAccountItem = ({ multiSafeAccountItem, onLinkClick, isSpaceSafe = false }: MultiAccountItemProps) => {
  const {
    address,
    name,
    sortedSafes,
    safeOverviews,
    totalFiatValue,
    hasReplayableSafe,
    isCurrentSafe,
    isReadOnly,
    isWelcomePage,
    deployedChainIds,
    isSpaceRoute,
  } = useMultiAccountItemData(multiSafeAccountItem)

  const [expanded, setExpanded] = useState(isCurrentSafe)
  const trackingLabel = isWelcomePage ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  const toggleExpand = () => {
    setExpanded((prev) => {
      if (!prev && !isSpaceRoute) {
        trackEvent({ ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE, label: trackingLabel })
      }
      return !prev
    })
  }

  const displayName = multiSafeAccountItem.name || name || shortenAddress(address)

  return (
    <Collapsible open={expanded} onOpenChange={toggleExpand} data-testid="safe-list-item">
      <div
        className={cn(
          'bg-card flex w-full flex-col rounded-3xl border-2 transition-colors',
          isCurrentSafe ? 'border-primary/30' : 'border-card',
        )}
      >
        <CollapsibleTrigger
          render={
            <button
              type="button"
              data-testid="multichain-item-summary"
              className="hover:bg-muted/50 flex w-full items-center justify-between gap-4 rounded-3xl py-4 pl-4 pr-6 text-left transition-colors cursor-pointer"
            />
          }
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="inline-flex shrink-0">
              <Identicon address={address} />
            </span>
            <div className="flex min-w-0 flex-col gap-1" data-testid="group-address">
              <Typography variant="paragraph-medium" className="text-foreground truncate">
                {displayName}
              </Typography>
              <Typography variant="paragraph-mini" color="muted" className="truncate">
                {shortenAddress(address)}
              </Typography>
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <BaseAccountItem.ChainBadge safes={sortedSafes} />
          </div>

          <div className="flex shrink-0 items-center justify-end" data-testid="group-balance">
            <FiatBalance value={totalFiatValue?.toString()} />
          </div>

          <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {!isSpaceSafe && (
              <BaseAccountItem.PinButton safeItems={sortedSafes} safeOverviews={safeOverviews} name={name} />
            )}
            {isSpaceSafe ? null : (
              <MultiAccountContextMenu
                name={multiSafeAccountItem.name ?? ''}
                address={address}
                chainIds={deployedChainIds}
                addNetwork={hasReplayableSafe}
              />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div data-testid="subacounts-container" className="flex flex-col gap-1 px-3 pb-3">
            {sortedSafes.map((safeItem) => {
              const overview = safeOverviews?.find(
                (o) => o.chainId === safeItem.chainId && sameAddress(o.address.value, safeItem.address),
              )
              return (
                <SubItem
                  key={`${safeItem.chainId}:${safeItem.address}`}
                  safeItem={safeItem}
                  safeOverview={overview}
                  onLinkClick={onLinkClick}
                />
              )
            })}

            {!isReadOnly && hasReplayableSafe && !isSpaceSafe && (
              <div className="border-border mt-1 flex items-center justify-center border-t pt-2">
                <AddNetworkButton
                  currentName={multiSafeAccountItem.name ?? ''}
                  safeAddress={address}
                  deployedChains={sortedSafes.map((s) => s.chainId)}
                />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default MultiAccountItem
