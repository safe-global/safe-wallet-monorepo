import type { MouseEvent } from 'react'
import type { SelectableSafe } from '../../hooks/useSafeSelectionModal.types'
import { useSafeItemData } from '../../hooks/useSafeItemData'
import { useIsMobile } from '../../hooks/useIsMobile'
import { hasQueuedItems } from '../../utils/accountItem'
import { AccountItem } from '../AccountItem'
import SimilarityWarning from './SimilarityWarning'
import css from '../AccountItems/styles.module.css'
import classnames from 'classnames'

interface SafeSelectionItemProps {
  safe: SelectableSafe
  onToggle: (address: string) => void
}

const SafeSelectionItem = ({ safe, onToggle }: SafeSelectionItemProps) => {
  const isMobile = useIsMobile()
  const { chain, name, safeOverview, isActivating, threshold, owners, undeployedSafe, elementRef } =
    useSafeItemData(safe)

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    onToggle(safe.address)
  }

  const hasQueued = hasQueuedItems(safe, safeOverview)

  const statusChips = (
    <>
      <AccountItem.StatusChip
        isActivating={isActivating}
        isReadOnly={safe.isReadOnly}
        undeployedSafe={!!undeployedSafe}
      />
      {hasQueued && safeOverview && (
        <AccountItem.QueueActions
          safeAddress={safeOverview.address.value}
          chainShortName={chain?.shortName || ''}
          queued={safeOverview.queued ?? 0}
          awaitingConfirmation={safeOverview.awaitingConfirmation ?? 0}
        />
      )}
      {safe.similarityGroup && <SimilarityWarning />}
    </>
  )

  return (
    <div className={css.listItem}>
      <AccountItem.Button onClick={handleClick} elementRef={elementRef}>
        <AccountItem.Checkbox checked={safe.isSelected} address={safe.address} />
        <AccountItem.Icon
          address={safe.address}
          size={isMobile ? 30 : undefined}
          chainId={safe.chainId}
          threshold={threshold}
          owners={owners.length}
        />
        <AccountItem.Info
          address={safe.address}
          chainId={safe.chainId}
          name={name}
          fullAddress
          showCopyButton
          hasExplorer
          highlight4bytes={!!safe.similarityGroup}
        >
          {!isMobile && statusChips}
        </AccountItem.Info>
        {!isMobile && (
          <>
            <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
            <AccountItem.ChainBadge chainId={safe.chainId} />
          </>
        )}
        <AccountItem.ContextMenu
          address={safe.address}
          chainId={safe.chainId}
          name={name}
          isReplayable={false}
          undeployedSafe={!!undeployedSafe}
        />
        {isMobile && (
          <>
            <div className={classnames(css.accountItemChips, css.balanceWrapper)}>
              <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
              <AccountItem.ChainBadge chainId={safe.chainId} />
            </div>
            <div className={css.accountItemChips}>{statusChips}</div>
          </>
        )}
      </AccountItem.Button>
    </div>
  )
}

export default SafeSelectionItem
