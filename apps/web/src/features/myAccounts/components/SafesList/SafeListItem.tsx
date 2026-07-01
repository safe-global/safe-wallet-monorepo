import { useMediaQuery, useTheme } from '@mui/material'
import { AccountItem } from '../AccountItem'
import { useSafeItemData } from '../../hooks/useSafeItemData'
import css from '../AccountItems/styles.module.css'
import type { SafeItem } from '@/hooks/safes'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { SimilarityFlag } from '@/features/address-poisoning'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

export interface SafeListItemProps {
  safeItem: SafeItem
  onLinkClick?: () => void
  isSpaceSafe?: boolean
  similarity?: SimilarityMatch | null
}

export const SafeListItem = ({ safeItem, onLinkClick, isSpaceSafe = false, similarity }: SafeListItemProps) => {
  const spaces = useLoadFeature(SpacesFeature)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

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

  const hasQueuedItems =
    !safeItem.isReadOnly &&
    safeOverview &&
    ((safeOverview.queued ?? 0) > 0 || (safeOverview.awaitingConfirmation ?? 0) > 0)

  const statusChips = (
    <>
      <SimilarityFlag match={similarity} />
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
          awaitingConfirmation={safeOverview.awaitingConfirmation ?? 0}
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
        similarity={similarity}
      >
        {!isMobile && statusChips}
      </AccountItem.Info>
      <AccountItem.ChainBadge chainId={safeItem.chainId} />
      <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
      {!isSpaceSafe && <AccountItem.PinButton safeItem={safeItem} threshold={threshold} owners={owners} name={name} />}
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
      {isMobile && <div className={css.accountItemChips}>{statusChips}</div>}
    </AccountItem.Link>
  )
}
