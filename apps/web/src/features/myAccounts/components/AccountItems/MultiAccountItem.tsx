import ChainIndicator from '@/components/common/ChainIndicator'
import FiatValue from '@/components/common/FiatValue'
import SafeIcon from '@/components/common/SafeIcon'
import MultiAccountContextMenu from '@/components/sidebar/SafeListContextMenu/MultiAccountContextMenu'
import { AppRoutes } from '@/config/routes'
import { selectUndeployedSafes } from '@/features/counterfactual/store/undeployedSafesSlice'
import { isPredictedSafeProps } from '@/features/counterfactual/utils'
import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import { getSafeSetups, getSharedSetup, hasMultiChainAddNetworkFeature } from '@/features/multichain/utils/utils'
import SingleAccountItem from '@/features/myAccounts/components/AccountItems/SingleAccountItem'
import { type SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { type MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { getComparator } from '@/features/myAccounts/utils/utils'
import SafenetAccountList from '@/features/safenet/components/SafenetAccountList'
import SafenetMultichainIndicator from '@/features/safenet/components/SafenetMultichainIndicator'
import useHasSafenetFeature from '@/features/safenet/hooks/useHasSafenetFeature'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import BookmarkedIcon from '@/public/images/apps/bookmarked.svg'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, PIN_SAFE_LABELS, trackEvent } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { addOrUpdateSafe, pinSafe, selectAllAddedSafes, unpinSafe } from '@/store/addedSafesSlice'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { selectChains } from '@/store/chainsSlice'
import { showNotification } from '@/store/notificationsSlice'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { defaultSafeInfo } from '@/store/safeInfoSlice'
import { useGetSafenetAccountQuery } from '@/store/safenet'
import { selectCurrency } from '@/store/settingsSlice'
import { sameAddress } from '@/utils/addresses'
import { shortenAddress } from '@/utils/formatters'
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
import type { SafeOverview } from '@safe-global/safe-gateway-typescript-sdk'
import classnames from 'classnames'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import { AddNetworkButton } from '../AddNetworkButton'
import css from './styles.module.css'
type MultiAccountItemProps = {
  multiSafeAccountItem: MultiChainSafeItem
  safeOverviews?: SafeOverview[]
  onLinkClick?: () => void
  hasSafenetFeature?: boolean
}

const MultichainIndicator = ({ safes, safenetSafes }: { safes: SafeItem[]; safenetSafes?: SafeItem[] }) => (
  <Tooltip
    title={
      <Box data-testid="multichain-tooltip">
        <Typography fontSize="14px">Multichain account on:</Typography>
        {safes.map((safeItem) => (
          <Box key={safeItem.chainId} sx={{ p: '4px 0px' }}>
            <ChainIndicator chainId={safeItem.chainId} />
          </Box>
        ))}
        {safenetSafes && <SafenetMultichainIndicator safenetSafes={safenetSafes} />}
      </Box>
    }
    arrow
  >
    <Box className={css.multiChains}>
      <NetworkLogosList networks={safes} showHasMore showHasSafenet={safenetSafes && safenetSafes.length > 0} />
    </Box>
  </Tooltip>
)

function useMultiAccountItemData(multiSafeAccountItem: MultiChainSafeItem) {
  const { address, safes, isPinned, name } = multiSafeAccountItem

  const router = useRouter()
  const isWelcomePage = router.pathname === AppRoutes.welcome.accounts
  const safeAddress = useSafeAddress()
  const isCurrentSafe = sameAddress(safeAddress, address)

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = useMemo(() => getComparator(orderBy), [orderBy])
  const sortedSafes = useMemo(() => [...safes].sort(sortComparator), [safes, sortComparator])

  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const deployedSafes = useMemo(
    () => sortedSafes.filter((safe) => !undeployedSafes[safe.chainId]?.[safe.address]),
    [sortedSafes, undeployedSafes],
  )

  const currency = useAppSelector(selectCurrency)
  const { address: walletAddress = '' } = useWallet() || {}

  const { data: safeOverviews } = useGetMultipleSafeOverviewsQuery({ currency, walletAddress, safes: deployedSafes })

  const safeSetups = useMemo(
    () => getSafeSetups(sortedSafes, safeOverviews ?? [], undeployedSafes),
    [safeOverviews, sortedSafes, undeployedSafes],
  )
  const sharedSetup = useMemo(() => getSharedSetup(safeSetups), [safeSetups])

  const totalFiatValue = useMemo(
    () => safeOverviews?.reduce((sum, overview) => sum + Number(overview.fiatTotal), 0),
    [safeOverviews],
  )

  const chains = useAppSelector(selectChains)
  const hasReplayableSafe = useMemo(() => {
    return sortedSafes.some((safeItem) => {
      const undeployedSafe = undeployedSafes[safeItem.chainId]?.[safeItem.address]
      const chain = chains.data.find((chain) => chain.chainId === safeItem.chainId)
      const addNetworkFeatureEnabled = hasMultiChainAddNetworkFeature(chain)
      // Replayable if deployed or new counterfactual safe and the chain supports add network
      return (!undeployedSafe || !isPredictedSafeProps(undeployedSafe.props)) && addNetworkFeatureEnabled
    })
  }, [chains.data, sortedSafes, undeployedSafes])

  const isReadOnly = useMemo(() => sortedSafes.every((safe) => safe.isReadOnly), [sortedSafes])

  const deployedChainIds = useMemo(() => sortedSafes.map((safe) => safe.chainId), [sortedSafes])

  const hasSafenetFeature = useHasSafenetFeature()
  const { data: safenetConfig } = useGetSafenetAccountQuery({ safeAddress: address }, { skip: !hasSafenetFeature })

  const nonSafenetSafes = useMemo(() => {
    if (safenetConfig) {
      const deployedSafenetChainIds = safenetConfig.safes.map((safe) => safe.chainId.toString())
      return sortedSafes.filter((safe) => !deployedSafenetChainIds.includes(safe.chainId))
    }
    return sortedSafes
  }, [safenetConfig, sortedSafes])

  const safenetSafes = useMemo(() => {
    if (safenetConfig) {
      const deployedSafenetChainIds = safenetConfig.safes.map((safe) => safe.chainId.toString())
      return sortedSafes.filter((safe) => deployedSafenetChainIds.includes(safe.chainId))
    }
  }, [safenetConfig, sortedSafes])

  return {
    address,
    name,
    sortedSafes,
    safeOverviews,
    sharedSetup,
    totalFiatValue,
    hasReplayableSafe,
    isPinned,
    isCurrentSafe,
    isReadOnly,
    isWelcomePage,
    deployedChainIds,
    safenetSafes,
    nonSafenetSafes,
  }
}

function usePinActions(
  address: string,
  name: string | undefined,
  safes: SafeItem[],
  safeOverviews: SafeOverview[] | undefined,
) {
  const dispatch = useAppDispatch()
  const allAddedSafes = useAppSelector(selectAllAddedSafes)

  const findOverview = useCallback(
    (item: SafeItem) => {
      return safeOverviews?.find(
        (overview) => item.chainId === overview.chainId && sameAddress(overview.address.value, item.address),
      )
    },
    [safeOverviews],
  )

  const addToPinnedList = useCallback(() => {
    const isGroupAdded = safes.every((safe) => allAddedSafes[safe.chainId]?.[safe.address])
    if (isGroupAdded) {
      for (const safe of safes) {
        dispatch(pinSafe({ chainId: safe.chainId, address: safe.address }))
      }
    } else {
      for (const safe of safes) {
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
  }, [name, safes, allAddedSafes, dispatch, findOverview, address])

  const removeFromPinnedList = useCallback(() => {
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
  }, [dispatch, name, address, safes])

  return { addToPinnedList, removeFromPinnedList }
}

const MultiAccountItem = ({ onLinkClick, multiSafeAccountItem }: MultiAccountItemProps) => {
  const {
    address,
    name,
    sortedSafes,
    safeOverviews,
    sharedSetup,
    totalFiatValue,
    hasReplayableSafe,
    isPinned,
    isCurrentSafe,
    isReadOnly,
    isWelcomePage,
    deployedChainIds,
    safenetSafes,
    nonSafenetSafes,
  } = useMultiAccountItemData(multiSafeAccountItem)
  const { addToPinnedList, removeFromPinnedList } = usePinActions(address, name, sortedSafes, safeOverviews)

  const [expanded, setExpanded] = useState(isCurrentSafe)
  const trackingLabel = isWelcomePage ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  const toggleExpand = () => {
    setExpanded((prev) => {
      if (!prev) {
        trackEvent({ ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE, label: trackingLabel })
      }
      return !prev
    })
  }

  return (
    <ListItemButton
      data-testid="safe-list-item"
      selected={isCurrentSafe}
      className={classnames(css.multiListItem, css.listItem, { [css.currentListItem]: isCurrentSafe })}
      sx={{ p: 0 }}
    >
      <Accordion data-testid="multichain-item-summary" expanded={expanded} sx={{ border: 'none' }}>
        <AccordionSummary
          onClick={toggleExpand}
          sx={{
            pl: 0,
            '& .MuiAccordionSummary-content': { m: '0 !important', alignItems: 'center' },
            '&.Mui-expanded': { backgroundColor: 'transparent !important' },
          }}
          component="div"
        >
          <Box className={classnames(css.multiSafeLink, css.safeLink)} width="100%">
            <Box sx={{ pr: 2.5 }} data-testid="group-safe-icon">
              <SafeIcon address={address} owners={sharedSetup?.owners.length} threshold={sharedSetup?.threshold} />
            </Box>
            <Typography variant="body2" component="div" className={css.safeAddress}>
              {multiSafeAccountItem.name && (
                <Typography variant="subtitle2" component="p" sx={{ fontWeight: 'bold' }} className={css.safeName}>
                  {multiSafeAccountItem.name}
                </Typography>
              )}
              <Typography
                data-testid="group-address"
                component="span"
                sx={{
                  color: 'var(--color-primary-light)',
                  fontSize: 'inherit',
                }}
              >
                {shortenAddress(address)}
              </Typography>
            </Typography>
            <MultichainIndicator safes={nonSafenetSafes} safenetSafes={safenetSafes} />
            <Typography
              data-testid="group-balance"
              variant="body2"
              sx={{
                fontWeight: 'bold',
                textAlign: 'right',
                pl: 2,
              }}
            >
              {totalFiatValue !== undefined ? (
                <FiatValue value={totalFiatValue} />
              ) : (
                <Skeleton variant="text" sx={{ ml: 'auto' }} />
              )}
            </Typography>
          </Box>
          <IconButton
            data-testid="bookmark-icon"
            edge="end"
            size="medium"
            sx={{ mx: 1 }}
            onClick={(event) => {
              event.stopPropagation()
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
          <MultiAccountContextMenu
            name={multiSafeAccountItem.name ?? ''}
            address={address}
            chainIds={deployedChainIds}
            addNetwork={hasReplayableSafe}
          />
        </AccordionSummary>
        <AccordionDetails sx={{ padding: '0px 12px' }}>
          {safenetSafes && <SafenetAccountList safenetSafes={safenetSafes} onLinkClick={onLinkClick} />}
          <Box data-testid="subacounts-container">
            {nonSafenetSafes.map((safeItem) => (
              <SingleAccountItem
                onLinkClick={onLinkClick}
                safeItem={safeItem}
                key={`${safeItem.chainId}:${safeItem.address}`}
                isMultiChainItem
              />
            ))}
          </Box>
          {!isReadOnly && hasReplayableSafe && (
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
    </ListItemButton>
  )
}

export default MultiAccountItem
