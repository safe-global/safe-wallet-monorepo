import { useState, type MouseEvent } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, useMediaQuery, useTheme } from '@mui/material'
import classnames from 'classnames'
import type { SelectableMultiChainSafe } from '../../hooks/useSafeSelectionModal.types'
import { useMultiAccountItemData } from '../../hooks/useMultiAccountItemData'
import { useSafeItemData } from '../../hooks/useSafeItemData'
import { AccountItem } from '../AccountItem'
import SimilarityWarning from './SimilarityWarning'
import css from '../AccountItems/styles.module.css'

interface MultiChainSelectionItemProps {
  multiSafe: SelectableMultiChainSafe
  onToggle: (address: string) => void
}

/**
 * Sub-item for each chain in a multichain group
 */
function MultiChainSubItem({
  safe,
  onToggle,
}: {
  safe: SelectableMultiChainSafe['safes'][number]
  onToggle: (address: string) => void
}) {
  const { chain, safeOverview, isActivating, threshold, owners, undeployedSafe } = useSafeItemData(safe)

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle(safe.address)
  }

  const hasQueuedItems =
    !safe.isReadOnly && safeOverview && ((safeOverview.queued ?? 0) > 0 || (safeOverview.awaitingConfirmation ?? 0) > 0)

  return (
    <AccountItem.Button onClick={handleClick}>
      <AccountItem.Icon
        address={safe.address}
        chainId={safe.chainId}
        threshold={threshold}
        owners={owners.length}
        isMultiChainItem
      />
      <AccountItem.Info address={safe.address} chainId={safe.chainId} chainName={chain?.chainName}>
        <AccountItem.StatusChip
          undeployedSafe={!!undeployedSafe}
          isActivating={isActivating}
          isReadOnly={safe.isReadOnly}
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
    </AccountItem.Button>
  )
}

/**
 * Multichain safe group item for the selection modal
 * Shows a header with the address and multichain badge, with expandable sub-items for each chain
 */
const MultiChainSelectionItem = ({ multiSafe, onToggle }: MultiChainSelectionItemProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [expanded, setExpanded] = useState(false)

  // Use multiSafe.safes directly as they're already SelectableSafe[]
  // Only use hook for computed values like sharedSetup and totalFiatValue
  const { sharedSetup, totalFiatValue } = useMultiAccountItemData(multiSafe)
  const { address, safes, name } = multiSafe

  const handleToggle = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle(address)
  }

  const toggleExpand = (e: MouseEvent) => {
    e.stopPropagation()
    setExpanded((prev) => !prev)
  }

  const statusChips = <>{multiSafe.similarityGroup && <SimilarityWarning />}</>

  return (
    <Box data-testid="safe-list-item" className={classnames(css.multiListItem, css.listItem)} sx={{ my: 0.5 }}>
      <Accordion data-testid="multichain-selection-item" expanded={expanded} sx={{ border: 'none' }}>
        <AccordionSummary
          onClick={toggleExpand}
          sx={{
            p: 0,
            '& .MuiAccordionSummary-content': { m: '0 !important', alignItems: 'center' },
            '&.Mui-expanded': { backgroundColor: 'transparent !important' },
          }}
          component="div"
        >
          <Box sx={{ flex: 1, minWidth: 0 }} onClick={handleToggle}>
            <AccountItem.Content data-testid="multichain-selection-content">
              <AccountItem.Checkbox checked={multiSafe.isSelected} address={address} />
              <AccountItem.Icon
                address={address}
                chainId={safes[0]?.chainId ?? '1'}
                threshold={sharedSetup?.threshold}
                owners={sharedSetup?.owners.length}
              />
              <AccountItem.Info
                address={address}
                chainId={safes[0]?.chainId ?? '1'}
                name={name}
                fullAddress
                showCopyButton
                hasExplorer
                showPrefix={false}
                highlight4bytes={!!multiSafe.similarityGroup}
              >
                {!isMobile && statusChips}
              </AccountItem.Info>
              <AccountItem.ChainBadge safes={safes} />
              <AccountItem.Balance fiatTotal={totalFiatValue?.toString()} isLoading={totalFiatValue === undefined} />
              <AccountItem.ContextMenu
                address={address}
                chainId={safes[0]?.chainId ?? '1'}
                name={name}
                isReplayable={false}
                undeployedSafe={false}
                hideNestedSafes
              />
            </AccountItem.Content>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: '0px 12px' }}>
          <Box data-testid="multichain-subaccounts-container">
            {safes.map((safeItem) => (
              <MultiChainSubItem key={`${safeItem.chainId}:${safeItem.address}`} safe={safeItem} onToggle={onToggle} />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
      {isMobile && <div className={css.accountItemChips}>{statusChips}</div>}
    </Box>
  )
}

export default MultiChainSelectionItem
