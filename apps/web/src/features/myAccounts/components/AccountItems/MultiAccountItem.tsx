import type { SafeListProps } from '../SafesList'
import { AccountItem } from '../AccountItem'
import { useSafeItemData } from '../../hooks/useSafeItemData'
import { useMultiAccountItemData } from '../../hooks/useMultiAccountItemData'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import css from './styles.module.css'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import classnames from 'classnames'
import { type MultiChainSafeItem, type SafeItem } from '@/hooks/safes'
import { AddNetworkButton } from '../AddNetworkButton'
import MultiAccountContextMenu from '@/components/sidebar/SafeListContextMenu/MultiAccountContextMenu'
import { ContactSource } from '@/hooks/useAllAddressBooks'

function MultiChainSubItem({
  safeItem,
  safeOverview,
  onLinkClick,
}: {
  safeItem: SafeItem
  safeOverview?: SafeOverview
  onLinkClick?: () => void
}) {
  const { chain, href, threshold, owners, elementRef, trackingLabel, isCurrentSafe, undeployedSafe, isActivating } =
    useSafeItemData(safeItem, {
      safeOverview,
    })

  const hasQueuedItems =
    !safeItem.isReadOnly &&
    safeOverview &&
    ((safeOverview.queued ?? 0) > 0 || (safeOverview.awaitingConfirmation ?? 0) > 0)

  return (
    <AccountItem.Link
      href={href}
      onLinkClick={onLinkClick}
      trackingLabel={trackingLabel}
      elementRef={elementRef}
      isCurrentSafe={isCurrentSafe}
    >
      <AccountItem.Icon
        address={safeItem.address}
        chainId={safeItem.chainId}
        threshold={threshold}
        owners={owners.length}
        isMultiChainItem
      />
      <AccountItem.Info address={safeItem.address} chainId={safeItem.chainId} chainName={chain?.chainName}>
        <AccountItem.StatusChip
          undeployedSafe={!!undeployedSafe}
          isActivating={isActivating}
          isReadOnly={safeItem.isReadOnly}
        />
        {hasQueuedItems && (
          <AccountItem.QueueActions
            safeAddress={safeOverview.address.value}
            chainShortName={chain?.shortName || ''}
            queued={safeOverview.queued ?? 0}
            awaitingConfirmation={safeOverview.awaitingConfirmation ?? 0}
          />
        )}
      </AccountItem.Info>
      <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
    </AccountItem.Link>
  )
}

type MultiAccountItemProps = {
  multiSafeAccountItem: MultiChainSafeItem
  safeOverviews?: SafeOverview[]
  onLinkClick?: SafeListProps['onLinkClick']
  isSpaceSafe?: boolean
}

const MultiAccountItem = ({ onLinkClick, multiSafeAccountItem, isSpaceSafe = false }: MultiAccountItemProps) => {
  const spaces = useLoadFeature(SpacesFeature)
  const {
    address,
    name,
    sortedSafes,
    safeOverviews,
    sharedSetup,
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

  return (
    <div
      data-testid="safe-list-item"
      className={classnames(css.multiListItem, css.listItem, { [css.currentListItem]: isCurrentSafe })}
    >
      <Collapsible open={expanded} onOpenChange={toggleExpand}>
        <CollapsibleTrigger
          data-testid="multichain-item-summary"
          render={<div className="flex w-full cursor-pointer items-center p-2" />}
        >
          <div className="min-w-0 flex-1">
            <AccountItem.Content data-testid="multichain-content">
              <AccountItem.Icon
                address={address}
                chainId={sortedSafes[0]?.chainId ?? '1'}
                threshold={sharedSetup?.threshold}
                owners={sharedSetup?.owners.length}
                data-testid="group-safe-icon"
              />
              <AccountItem.Info
                address={address}
                chainId={sortedSafes[0]?.chainId ?? '1'}
                name={multiSafeAccountItem.name}
                showPrefix={false}
                addressBookNameSource={isSpaceSafe ? ContactSource.space : undefined}
                data-testid="group-address"
              />
              <AccountItem.ChainBadge safes={sortedSafes} />
              <AccountItem.Balance
                fiatTotal={totalFiatValue}
                isLoading={totalFiatValue === undefined}
                data-testid="group-balance"
              />
              <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
                {!isSpaceSafe && (
                  <AccountItem.PinButton safeItems={sortedSafes} safeOverviews={safeOverviews} name={name} />
                )}
                {isSpaceSafe ? (
                  <>
                    <div className="w-10" />
                    <spaces.SpaceSafeContextMenu safeItem={multiSafeAccountItem} />
                  </>
                ) : (
                  <MultiAccountContextMenu
                    name={multiSafeAccountItem.name ?? ''}
                    address={address}
                    chainIds={deployedChainIds}
                    addNetwork={hasReplayableSafe}
                  />
                )}
              </span>
            </AccountItem.Content>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3">
          <div data-testid="subacounts-container">
            {sortedSafes.map((safeItem) => {
              const overview = safeOverviews?.find(
                (o) => o.chainId === safeItem.chainId && sameAddress(o.address.value, safeItem.address),
              )
              return (
                <MultiChainSubItem
                  key={`${safeItem.chainId}:${safeItem.address}`}
                  safeItem={safeItem}
                  safeOverview={overview}
                  onLinkClick={onLinkClick}
                />
              )
            })}
          </div>
          {!isReadOnly && hasReplayableSafe && !isSpaceSafe && (
            <>
              <Separator className="-mx-3" />
              <div className="-mx-3 flex items-center justify-center">
                <AddNetworkButton
                  currentName={multiSafeAccountItem.name ?? ''}
                  safeAddress={address}
                  deployedChains={sortedSafes.map((safe) => safe.chainId)}
                />
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default MultiAccountItem
