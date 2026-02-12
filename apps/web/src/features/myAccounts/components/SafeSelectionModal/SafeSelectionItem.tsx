import type { MouseEvent } from 'react'
import { useMediaQuery, useTheme } from '@mui/material'
import type { SelectableSafe } from '../../hooks/useSafeSelectionModal.types'
import { useSafeItemData } from '../../hooks/useSafeItemData'
import { AccountItem } from '../AccountItem'
import SimilarityWarning from './SimilarityWarning'
import css from '../AccountItems/styles.module.css'

interface SafeSelectionItemProps {
  safe: SelectableSafe
  onToggle: (address: string) => void
}

/**
 * Individual safe item in the selection modal
 * Uses AccountItem compound components for consistent styling.
 * Includes balance, signers, status chips, queue actions, and rename menu.
 * Allows selecting/deselecting safes including already-pinned ones.
 */
const SafeSelectionItem = ({ safe, onToggle }: SafeSelectionItemProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Get rich data (balance, threshold, owners, etc.)
  const { chain, name, safeOverview, isActivating, threshold, owners, undeployedSafe, elementRef } =
    useSafeItemData(safe)

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    onToggle(safe.address)
  }

  // Check for queued transactions
  const hasQueuedItems =
    !safe.isReadOnly && safeOverview && ((safeOverview.queued ?? 0) > 0 || (safeOverview.awaitingConfirmation ?? 0) > 0)

  const statusChips = (
    <>
      <AccountItem.StatusChip
        isActivating={isActivating}
        isReadOnly={safe.isReadOnly}
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
      {safe.similarityGroup && <SimilarityWarning />}
    </>
  )

  return (
    <AccountItem.Button onClick={handleClick} elementRef={elementRef}>
      <AccountItem.Checkbox checked={safe.isSelected} address={safe.address} />
      <AccountItem.Icon address={safe.address} chainId={safe.chainId} threshold={threshold} owners={owners.length} />
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
      <AccountItem.ChainBadge chainId={safe.chainId} />
      <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
      <AccountItem.ContextMenu
        address={safe.address}
        chainId={safe.chainId}
        name={name}
        isReplayable={false}
        undeployedSafe={!!undeployedSafe}
        hideNestedSafes
      />
      {isMobile && <div className={css.accountItemChips}>{statusChips}</div>}
    </AccountItem.Button>
  )
}

export default SafeSelectionItem
