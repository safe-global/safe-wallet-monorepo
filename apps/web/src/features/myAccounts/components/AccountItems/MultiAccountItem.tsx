import type { SafeListProps } from '../SafesList'
import SpaceSafeContextMenu from '@/features/spaces/components/SafeAccounts/SpaceSafeContextMenu'
import { AccountItem } from '../AccountItem'
import { useSafeItemData } from '../../hooks/useSafeItemData'
import { useMultiAccountItemData } from '../../hooks/useMultiAccountItemData'
import { useIsMobile } from '../../hooks/useIsMobile'
import { hasQueuedItems } from '../../utils/accountItem'
import { accordionSummarySx } from './styles'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider } from '@mui/material'
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
  const isMobile = useIsMobile()
  const { chain, href, threshold, owners, elementRef, trackingLabel, isCurrentSafe, undeployedSafe, isActivating } =
    useSafeItemData(safeItem, { safeOverview })

  const hasQueued = hasQueuedItems(safeItem, safeOverview)

  const statusChips = (
    <>
      <AccountItem.StatusChip
        undeployedSafe={!!undeployedSafe}
        isActivating={isActivating}
        isReadOnly={safeItem.isReadOnly}
      />
      {hasQueued && safeOverview && (
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
      trackingLabel={trackingLabel}
      elementRef={elementRef}
      isCurrentSafe={isCurrentSafe}
    >
      <AccountItem.Icon
        address={safeItem.address}
        size={isMobile ? 30 : undefined}
        chainId={safeItem.chainId}
        threshold={threshold}
        owners={owners.length}
        isMultiChainItem
      />
      <AccountItem.Info address={safeItem.address} chainId={safeItem.chainId} chainName={chain?.chainName}>
        {!isMobile && statusChips}
      </AccountItem.Info>
      {!isMobile && (
        <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
      )}
      {!isMobile && <AccountItem.ChainBadge chainId={safeItem.chainId} />}
      {isMobile && (
        <div className={css.accountItemChips}>
          <AccountItem.Balance fiatTotal={safeOverview?.fiatTotal} isLoading={!safeOverview && !undeployedSafe} />
          <AccountItem.ChainBadge chainId={safeItem.chainId} />
        </div>
      )}
      {isMobile && <div className={css.accountItemChips}>{statusChips}</div>}
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
  const isMobile = useIsMobile()
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
    <Box
      data-testid="safe-list-item"
      className={classnames(css.multiListItem, css.listItem, { [css.currentListItem]: isCurrentSafe })}
    >
      <Accordion data-testid="multichain-item-summary" expanded={expanded} sx={{ border: 'none' }}>
        <AccordionSummary onClick={toggleExpand} sx={accordionSummarySx} component="div">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AccountItem.Content data-testid="multichain-content">
              <AccountItem.Icon
                address={address}
                size={isMobile ? 30 : undefined}
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
              {!isMobile && (
                <AccountItem.Balance
                  fiatTotal={totalFiatValue}
                  isLoading={totalFiatValue === undefined}
                  data-testid="group-balance"
                />
              )}
              {!isMobile && <AccountItem.ChainBadge safes={sortedSafes} />}
              {!isSpaceSafe && (
                <AccountItem.PinButton safeItems={sortedSafes} safeOverviews={safeOverviews} name={name} />
              )}
              {isSpaceSafe ? (
                <>
                  <Box width="40px" />
                  <SpaceSafeContextMenu safeItem={multiSafeAccountItem} />
                </>
              ) : (
                <MultiAccountContextMenu
                  name={multiSafeAccountItem.name ?? ''}
                  address={address}
                  chainIds={deployedChainIds}
                  addNetwork={hasReplayableSafe}
                />
              )}
            </AccountItem.Content>
            {isMobile && (
              <div className={classnames(css.accountItemChips, css.accountItemChipsSpaced)}>
                <AccountItem.Balance
                  fiatTotal={totalFiatValue}
                  isLoading={totalFiatValue === undefined}
                  data-testid="group-balance"
                />
                <AccountItem.ChainBadge safes={sortedSafes} />
              </div>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: '0px 12px' }}>
          <Box data-testid="subacounts-container">
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
          </Box>
          {!isReadOnly && hasReplayableSafe && !isSpaceSafe && (
            <>
              <Divider sx={{ ml: '-12px', mr: '-12px' }} />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ml: '-12px',
                  mr: '-12px',
                }}
              >
                <AddNetworkButton
                  currentName={multiSafeAccountItem.name ?? ''}
                  safeAddress={address}
                  deployedChains={sortedSafes.map((safe) => safe.chainId)}
                />
              </Box>
            </>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default MultiAccountItem
