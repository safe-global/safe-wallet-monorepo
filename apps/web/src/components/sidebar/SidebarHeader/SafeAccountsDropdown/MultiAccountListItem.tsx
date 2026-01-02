import type { ReactElement } from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  IconButton,
  ListItemButton,
  Skeleton,
  SvgIcon,
  Tooltip,
  Typography,
} from '@mui/material'

import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAppDispatch, useAppSelector } from '@/store'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import SafeIcon from '@/components/common/SafeIcon'
import EthHashInfo from '@/components/common/EthHashInfo'
import FiatValue from '@/components/common/FiatValue'
import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import ChainIndicator from '@/components/common/ChainIndicator'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import BookmarkedIcon from '@/public/images/apps/bookmarked.svg'
import { addOrUpdateSafe, pinSafe, selectAllAddedSafes, unpinSafe } from '@/store/addedSafesSlice'
import { showNotification } from '@/store/notificationsSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, PIN_SAFE_LABELS, trackEvent } from '@/services/analytics'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { selectUndeployedSafes } from '@/features/counterfactual/store/undeployedSafesSlice'
import { getSafeSetups, getSharedSetup, hasMultiChainAddNetworkFeature } from '@/features/multichain/utils/utils'
import { isPredictedSafeProps } from '@/features/counterfactual/utils'
import { AddNetworkButton } from '@/features/myAccounts/components/AddNetworkButton'
import useChains from '@/hooks/useChains'
import MultiAccountContextMenu from '@/components/sidebar/SafeListContextMenu/MultiAccountContextMenu'
import AccountListItem from './AccountListItem'
import classnames from 'classnames'

import css from './styles.module.css'

type MultiAccountListItemProps = {
  multiSafeItem: MultiChainSafeItem
  onSelect?: () => void
  showBalance?: boolean
}

export const MultichainIndicator = ({ safes }: { safes: SafeItem[] }) => {
  return (
    <Box className={css.multiChains}>
      <Tooltip
        title={
          <Box>
            <Typography fontSize="14px">Multichain account on:</Typography>
            {safes.map((safeItem) => (
              <Box key={safeItem.chainId} sx={{ p: '4px 0px' }}>
                <ChainIndicator chainId={safeItem.chainId} />
              </Box>
            ))}
          </Box>
        }
        arrow
      >
        <Box>
          <NetworkLogosList networks={safes} showHasMore />
        </Box>
      </Tooltip>
    </Box>
  )
}

/**
 * Multi-chain safe list item for dropdown
 * Shows accordion with multiple network logos and expandable chain list
 */
const MultiAccountListItem = ({
  multiSafeItem,
  onSelect,
  showBalance = true,
}: MultiAccountListItemProps): ReactElement => {
  const { address, safes, isPinned, name } = multiSafeItem
  const safeAddress = useSafeAddress()
  const isCurrentSafe = sameAddress(safeAddress, address)
  const [expanded, setExpanded] = useState(isCurrentSafe)
  const dispatch = useAppDispatch()
  const allAddedSafes = useAppSelector(selectAllAddedSafes)

  // Get safe overviews for balance calculation
  const currency = useAppSelector(selectCurrency)
  const { address: walletAddress } = useWallet() || {}
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const deployedSafes = useMemo(
    () => safes.filter((safe) => !undeployedSafes[safe.chainId]?.[safe.address]),
    [safes, undeployedSafes],
  )

  const { data: safeOverviews } = useGetMultipleSafeOverviewsQuery({ currency, walletAddress, safes: deployedSafes })

  // Calculate shared setup (owners/threshold)
  const safeSetups = useMemo(
    () => getSafeSetups(safes, safeOverviews ?? [], undeployedSafes),
    [safeOverviews, safes, undeployedSafes],
  )
  const sharedSetup = useMemo(() => getSharedSetup(safeSetups), [safeSetups])

  // Calculate total balance across all chains
  const totalFiatValue = useMemo(
    () => safeOverviews?.reduce((sum, overview) => sum + Number(overview.fiatTotal), 0),
    [safeOverviews],
  )

  // Check if any safe in this multi-chain group is replayable (for Add Network button)
  const { configs: chains } = useChains()
  const hasReplayableSafe = useMemo(() => {
    return safes.some((safeItem) => {
      const undeployedSafe = undeployedSafes[safeItem.chainId]?.[safeItem.address]
      const chain = chains.find((chain) => chain.chainId === safeItem.chainId)
      const addNetworkFeatureEnabled = hasMultiChainAddNetworkFeature(chain)
      // Replayable if deployed or new counterfactual safe and the chain supports add network
      return (!undeployedSafe || !isPredictedSafeProps(undeployedSafe.props)) && addNetworkFeatureEnabled
    })
  }, [chains, safes, undeployedSafes])

  const isReadOnly = useMemo(() => safes.every((safe) => safe.isReadOnly), [safes])

  const findOverview = useCallback(
    (item: SafeItem) => {
      return safeOverviews?.find(
        (overview) => item.chainId === overview.chainId && sameAddress(overview.address.value, item.address),
      )
    },
    [safeOverviews],
  )

  const addToPinnedList = () => {
    const isGroupAdded = safes.every((safe: SafeItem) => allAddedSafes[safe.chainId]?.[safe.address])
    if (isGroupAdded) {
      for (const safe of safes as SafeItem[]) {
        dispatch(pinSafe({ chainId: safe.chainId, address: safe.address }))
      }
    } else {
      for (const safe of safes as SafeItem[]) {
        const overview = findOverview(safe)
        dispatch(
          addOrUpdateSafe({
            safe: {
              ...defaultSafeInfo,
              chainId: safe.chainId,
              address: { value: address },
              owners: overview ? overview.owners : defaultSafeInfo.owners,
              threshold: overview ? overview.threshold : defaultSafeInfo.threshold,
            },
          }),
        )
        dispatch(pinSafe({ chainId: safe.chainId, address: safe.address }))
      }
    }

    dispatch(
      showNotification({
        title: 'Pinned multi-chain Safe',
        message: name ?? shortenAddress(address),
        groupKey: `pin-safe-success-${address}`,
        variant: 'success',
      }),
    )

    trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.pin })
  }

  const removeFromPinnedList = () => {
    for (const safe of safes) {
      dispatch(unpinSafe({ chainId: safe.chainId, address: safe.address }))
    }

    dispatch(
      showNotification({
        title: 'Unpinned multi-chain Safe',
        message: name ?? shortenAddress(address),
        groupKey: `unpin-safe-success-${address}`,
        variant: 'success',
      }),
    )

    trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.unpin })
  }

  const toggleExpand = () => {
    setExpanded((prev) => {
      if (!prev) {
        trackEvent({ ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE, label: OVERVIEW_LABELS.sidebar_dropdown })
      }
      return !prev
    })
  }

  const deployedChainIds = useMemo(() => safes.map((safe: SafeItem) => safe.chainId), [safes])

  return (
    <ListItemButton
      data-testid="multi-account-list-item"
      selected={isCurrentSafe}
      className={classnames(css.accountListItem, css.multiAccountListItem, {
        [css.currentItem]: isCurrentSafe,
      })}
      sx={{ p: 0, display: 'block' }}
    >
      <Accordion
        expanded={expanded}
        sx={{
          border: 'none',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          '&.Mui-expanded': { margin: 0 },
        }}
      >
        <AccordionSummary
          onClick={toggleExpand}
          sx={{
            padding: 0,
            minHeight: '60px !important',
            '& .MuiAccordionSummary-content': { m: '0 !important', alignItems: 'center', width: '100%' },
            '& .MuiAccordionSummary-content.Mui-expanded': { m: '0 !important' },
            '&.Mui-expanded': { minHeight: '60px !important' },
          }}
          component="div"
        >
          <Box className={css.multiSafeLink}>
            <Box sx={{ pr: 2.5 }}>
              <SafeIcon address={address} owners={sharedSetup?.owners.length} threshold={sharedSetup?.threshold} />
            </Box>

            <Box className={css.safeInfo}>
              <EthHashInfo address={address} name={name} showName shortAddress showAvatar={false} copyAddress={false} />
            </Box>

            <MultichainIndicator safes={safes} />

            {showBalance && (
              <Typography variant="body2" className={css.balance}>
                {totalFiatValue !== undefined ? (
                  <FiatValue value={totalFiatValue} />
                ) : (
                  <Skeleton variant="text" width={60} />
                )}
              </Typography>
            )}
          </Box>

          <Box className={css.accountActions}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                isPinned ? removeFromPinnedList() : addToPinnedList()
              }}
            >
              <SvgIcon
                component={isPinned ? BookmarkedIcon : BookmarkIcon}
                inheritViewBox
                color={isPinned ? 'primary' : undefined}
                fontSize="small"
              />
            </IconButton>

            <MultiAccountContextMenu name={name ?? ''} address={address} chainIds={deployedChainIds} addNetwork />
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ padding: '12px' }}>
          <Box>
            {safes.map((safeItem: SafeItem) => (
              <AccountListItem
                key={`${safeItem.chainId}:${safeItem.address}`}
                safeItem={safeItem}
                onSelect={onSelect}
                showBalance={showBalance}
                isMultiChainItem
              />
            ))}

            {!isReadOnly && hasReplayableSafe && (
              <>
                <Divider sx={{ ml: '-12px', mr: '-12px' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ml: '-12px', mr: '-12px' }}>
                  <AddNetworkButton currentName={name ?? ''} safeAddress={address} deployedChains={deployedChainIds} />
                </Box>
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </ListItemButton>
  )
}

export default MultiAccountListItem
