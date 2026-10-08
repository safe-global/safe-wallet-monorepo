import { useIsBelowSm } from '@/hooks/useMediaQuery'
import { AccountItem } from '../AccountItem'
import { useSafeItemData } from '../../hooks/useSafeItemData'
import type { SafeItem } from '@/hooks/safes'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { getOwnerAwaitingConfirmations } from '@/utils/transaction-guards'
import { SafeListItemView } from '@views/features/myAccounts/components/SafesList/SafeListItemView'

export interface SafeListItemProps {
  safeItem: SafeItem
  onLinkClick?: () => void
  isSpaceSafe?: boolean
}

export const SafeListItem = ({ safeItem, onLinkClick, isSpaceSafe = false }: SafeListItemProps) => {
  const spaces = useLoadFeature(SpacesFeature)
  const isMobile = useIsBelowSm()

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
    walletAddress,
  } = useSafeItemData(safeItem, { isSpaceSafe })

  const awaitingConfirmation = getOwnerAwaitingConfirmations(safeOverview, walletAddress)

  const hasQueuedItems =
    !safeItem.isReadOnly && safeOverview && ((safeOverview.queued ?? 0) > 0 || awaitingConfirmation > 0)

  const statusChips = (
    <>
      <AccountItem.StatusChip
        isActivating={isActivating}
        isReadOnly={safeItem.isReadOnly}
        undeployedSafe={!!undeployedSafe}
      />
      {hasQueuedItems && (
        <AccountItem.QueueActions
          safeAddress={safeOverview.address.value}
          chainShortName={chain?.shortName || ''}
          queued={safeOverview.queued ?? 0}
          awaitingConfirmation={awaitingConfirmation}
        />
      )}
    </>
  )

  return (
    <AccountItem.Link
      href={href}
      onLinkClick={onLinkClick}
      isCurrentSafe={isCurrentSafe}
      trackingLabel={trackingLabel}
      elementRef={elementRef}
    >
      <SafeListItemView isMobile={isMobile} statusChips={statusChips}>
        <AccountItem.Icon
          address={safeItem.address}
          chainId={safeItem.chainId}
          threshold={threshold}
          owners={owners.length}
        />
        <AccountItem.Info
          address={safeItem.address}
          chainId={safeItem.chainId}
          name={isSpaceSafe ? safeItem.name : name}
        >
          {!isMobile && statusChips}
        </AccountItem.Info>
        <AccountItem.ChainBadge chainId={safeItem.chainId} />
        <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
        {!isSpaceSafe && (
          <AccountItem.PinButton safeItem={safeItem} threshold={threshold} owners={owners} name={name} />
        )}
        {isSpaceSafe ? (
          <>
            {safeOverview && <spaces.SendTransactionButton safe={safeOverview} />}
            <spaces.SpaceSafeContextMenu safeItem={safeItem} />
          </>
        ) : (
          <AccountItem.ContextMenu
            address={safeItem.address}
            chainId={safeItem.chainId}
            name={name}
            isReplayable={isReplayable}
            undeployedSafe={!!undeployedSafe}
            hideNestedSafes={true}
            onClose={onLinkClick}
          />
        )}
      </SafeListItemView>
    </AccountItem.Link>
  )
}
