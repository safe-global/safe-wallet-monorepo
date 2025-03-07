import ChainIndicator from '@/components/common/ChainIndicator'
import Track from '@/components/common/Track'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppSelector } from '@/store'
import { selectChains } from '@/store/chainsSlice'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import {
  Box,
  ButtonBase,
  CircularProgress,
  Collapse,
  Divider,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import partition from 'lodash/partition'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import type { NextRouter } from 'next/router'
import { useRouter } from 'next/router'
import css from './styles.module.css'
import { useChainId } from '@/hooks/useChainId'
import { type ReactElement, useCallback, useMemo, useState } from 'react'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'

import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@/utils/addresses'
import uniq from 'lodash/uniq'
import { useCompatibleNetworks } from '@/features/multichain/hooks/useCompatibleNetworks'
import { useSafeCreationData } from '@/features/multichain/hooks/useSafeCreationData'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import PlusIcon from '@/public/images/common/plus.svg'
import useAddressBook from '@/hooks/useAddressBook'
import { CreateSafeOnSpecificChain } from '@/features/multichain/components/CreateSafeOnNewChain'
import { useGetSafeOverviewQuery } from '@/store/api/gateway'
import { InfoOutlined } from '@mui/icons-material'
import { selectUndeployedSafe } from '@/store/slices'
import { skipToken } from '@reduxjs/toolkit/query'
import { hasMultiChainAddNetworkFeature } from '@/features/multichain/utils/utils'

const ChainIndicatorWithFiatBalance = ({
  isSelected,
  chain,
  safeAddress,
}: {
  isSelected: boolean
  chain: ChainInfo
  safeAddress: string
}) => {
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chain.chainId, safeAddress))
  const { data: safeOverview } = useGetSafeOverviewQuery(
    undeployedSafe ? skipToken : { safeAddress, chainId: chain.chainId },
  )

  return (
    <ChainIndicator
      responsive={isSelected}
      chainId={chain.chainId}
      fiatValue={safeOverview ? safeOverview.fiatTotal : undefined}
      inline
    />
  )
}

export const getNetworkLink = (router: NextRouter, safeAddress: string, networkShortName: string) => {
  const isSafeOpened = safeAddress !== ''

  const query = (
    isSafeOpened
      ? {
          safe: `${networkShortName}:${safeAddress}`,
        }
      : { chain: networkShortName }
  ) as {
    safe?: string
    chain?: string
    safeViewRedirectURL?: string
    appUrl?: string
  }

  const route = {
    pathname: router.pathname,
    query,
  }

  if (router.query?.safeViewRedirectURL) {
    route.query.safeViewRedirectURL = router.query?.safeViewRedirectURL.toString()
  }

  if (router.query?.appUrl) {
    route.query.appUrl = router.query.appUrl.toString()
  }

  return route
}

const UndeployedNetworkMenuItem = ({
  chain,
  isSelected = false,
  onSelect,
}: {
  chain: ChainInfo & { available: boolean }
  isSelected?: boolean
  onSelect: (chain: ChainInfo) => void
}) => {
  const isDisabled = !chain.available

  return (
    <Track {...OVERVIEW_EVENTS.ADD_NEW_NETWORK} label={OVERVIEW_LABELS.top_bar}>
      <Tooltip data-testid="add-network-tooltip" title="Add network" arrow placement="left">
        <MenuItem
          value={chain.chainId}
          sx={{ '&:hover': { backgroundColor: 'inherit' } }}
          onClick={() => onSelect(chain)}
          disabled={isDisabled}
        >
          <Box className={css.item}>
            <ChainIndicator responsive={isSelected} chainId={chain.chainId} inline />
            {isDisabled ? (
              <Typography variant="caption" component="span" className={css.comingSoon}>
                Not available
              </Typography>
            ) : (
              <PlusIcon className={css.plusIcon} />
            )}
          </Box>
        </MenuItem>
      </Tooltip>
    </Track>
  )
}

const NetworkSkeleton = () => {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        p: '4px 0px',
      }}
    >
      <Skeleton variant="circular" width="24px" height="24px" />
      <Skeleton variant="rounded" sx={{ flexGrow: 1 }} />
    </Stack>
  )
}

const TestnetDivider = () => {
  return (
    <Divider sx={{ m: '0px !important', '& .MuiDivider-wrapper': { p: '0px 16px' } }}>
      <Typography
        variant="overline"
        sx={{
          color: 'border.main',
        }}
      >
        Testnets
      </Typography>
    </Divider>
  )
}

const UndeployedNetworks = ({
  deployedChains,
  chains,
  safeAddress,
  closeNetworkSelect,
}: {
  deployedChains: string[]
  chains: ChainInfo[]
  safeAddress: string
  closeNetworkSelect: () => void
}) => {
  const [open, setOpen] = useState(false)
  const [replayOnChain, setReplayOnChain] = useState<ChainInfo>()
  const addressBook = useAddressBook()
  const safeName = addressBook[safeAddress]
  const deployedChainInfos = useMemo(
    () => chains.filter((chain) => deployedChains.includes(chain.chainId)),
    [chains, deployedChains],
  )
  const safeCreationResult = useSafeCreationData(safeAddress, deployedChainInfos)
  const [safeCreationData, safeCreationDataError, safeCreationLoading] = safeCreationResult

  const allCompatibleChains = useCompatibleNetworks(safeCreationData)
  const isUnsupportedSafeCreationVersion = Boolean(!allCompatibleChains?.length)

  const availableNetworks = useMemo(
    () =>
      allCompatibleChains?.filter(
        (config) => !deployedChains.includes(config.chainId) && hasMultiChainAddNetworkFeature(config),
      ) || [],
    [allCompatibleChains, deployedChains],
  )

  const [testNets, prodNets] = useMemo(
    () => partition(availableNetworks, (config) => config.isTestnet),
    [availableNetworks],
  )

  const noAvailableNetworks = useMemo(() => availableNetworks.every((config) => !config.available), [availableNetworks])

  const onSelect = (chain: ChainInfo) => {
    setReplayOnChain(chain)
  }

  if (safeCreationLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          my: 1,
        }}
      >
        <CircularProgress size={18} />
      </Box>
    )
  }

  const errorMessage =
    safeCreationDataError || (safeCreationData && noAvailableNetworks) ? (
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
        }}
      >
        {safeCreationDataError?.message && (
          <Tooltip title={safeCreationDataError?.message}>
            <InfoOutlined color="info" fontSize="medium" />
          </Tooltip>
        )}
        <Typography>Adding another network is not possible for this Safe. </Typography>
      </Stack>
    ) : isUnsupportedSafeCreationVersion ? (
      'This account was created from an outdated mastercopy. Adding another network is not possible.'
    ) : (
      ''
    )

  if (errorMessage) {
    return (
      <Box
        sx={{
          px: 2,
          py: 1,
        }}
      >
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: '14px',
            maxWidth: 300,
          }}
        >
          {errorMessage}
        </Typography>
      </Box>
    )
  }

  const onFormClose = () => {
    setReplayOnChain(undefined)
    closeNetworkSelect()
  }

  const onShowAllNetworks = () => {
    !open && trackEvent(OVERVIEW_EVENTS.SHOW_ALL_NETWORKS)
    setOpen((prev) => !prev)
  }

  return (
    <>
      <ButtonBase className={css.listSubHeader} onClick={onShowAllNetworks} tabIndex={-1}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
          }}
        >
          <div data-testid="show-all-networks">Show all networks</div>

          <ExpandMoreIcon
            fontSize="small"
            sx={{
              transform: open ? 'rotate(180deg)' : undefined,
            }}
          />
        </Stack>
      </ButtonBase>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {!safeCreationData ? (
          <Box
            sx={{
              p: '0px 16px',
            }}
          >
            <NetworkSkeleton />
            <NetworkSkeleton />
          </Box>
        ) : (
          <>
            {prodNets.map((chain) => (
              <UndeployedNetworkMenuItem chain={chain} onSelect={onSelect} key={chain.chainId} />
            ))}
            {testNets.length > 0 && <TestnetDivider />}
            {testNets.map((chain) => (
              <UndeployedNetworkMenuItem chain={chain} onSelect={onSelect} key={chain.chainId} />
            ))}
          </>
        )}
      </Collapse>
      {replayOnChain && safeCreationData && (
        <CreateSafeOnSpecificChain
          chain={replayOnChain}
          safeAddress={safeAddress}
          open
          onClose={onFormClose}
          currentName={safeName ?? ''}
          safeCreationResult={safeCreationResult}
        />
      )}
    </>
  )
}

const NetworkSelector = ({
  onChainSelect,
  offerSafeCreation = false,
}: {
  onChainSelect?: () => void
  offerSafeCreation?: boolean
}): ReactElement => {
  const [open, setOpen] = useState<boolean>(false)
  const isDarkMode = useDarkMode()
  const theme = useTheme()
  const { configs } = useChains()
  const chainId = useChainId()
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const currentChain = useCurrentChain()
  const chains = useAppSelector(selectChains)

  const isSafeOpened = safeAddress !== ''

  const addNetworkFeatureEnabled = hasMultiChainAddNetworkFeature(currentChain)

  const safesGrouped = useAllSafesGrouped()
  const availableChainIds = useMemo(() => {
    if (!isSafeOpened) {
      // Offer all chains
      return configs.map((config) => config.chainId)
    }
    return uniq([
      chainId,
      ...(safesGrouped.allMultiChainSafes
        ?.find((item) => sameAddress(item.address, safeAddress))
        ?.safes.map((safe) => safe.chainId) ?? []),
    ])
  }, [chainId, configs, isSafeOpened, safeAddress, safesGrouped.allMultiChainSafes])

  const [testNets, prodNets] = useMemo(
    () =>
      partition(
        configs.filter((config) => availableChainIds.includes(config.chainId)),
        (config) => config.isTestnet,
      ),
    [availableChainIds, configs],
  )

  const renderMenuItem = useCallback(
    (chainId: string, isSelected: boolean) => {
      const chain = chains.data.find((chain) => chain.chainId === chainId)
      if (!chain) return null

      const onSwitchNetwork = () => {
        trackEvent({ ...OVERVIEW_EVENTS.SWITCH_NETWORK, label: chainId })
      }

      return (
        <MenuItem
          key={chainId}
          value={chainId}
          sx={{ '&:hover': { backgroundColor: isSelected ? 'transparent' : 'inherit' } }}
          disableRipple={isSelected}
          onClick={onSwitchNetwork}
        >
          <Link
            href={getNetworkLink(router, safeAddress, chain.shortName)}
            onClick={onChainSelect}
            className={css.item}
          >
            <ChainIndicatorWithFiatBalance chain={chain} safeAddress={safeAddress} isSelected={isSelected} />
          </Link>
        </MenuItem>
      )
    },
    [chains.data, onChainSelect, router, safeAddress],
  )

  const handleClose = () => {
    setOpen(false)
  }

  const handleOpen = () => {
    setOpen(true)
    offerSafeCreation && trackEvent({ ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE, label: OVERVIEW_LABELS.top_bar })
  }

  return configs.length ? (
    <Select
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
      value={chainId}
      size="small"
      className={css.select}
      variant="standard"
      IconComponent={ExpandMoreIcon}
      renderValue={(value) => renderMenuItem(value, true)}
      MenuProps={{
        transitionDuration: 0,
        sx: {
          '& .MuiPaper-root': {
            overflow: 'auto',
            minWidth: '260px !important',
          },
          ...(isDarkMode
            ? {
                '& .Mui-selected, & .Mui-selected:hover': {
                  backgroundColor: `${theme.palette.secondary.background} !important`,
                },
              }
            : {}),
        },
      }}
      sx={{
        '& .MuiSelect-select': {
          py: 0,
        },
      }}
    >
      {prodNets.map((chain) => renderMenuItem(chain.chainId, false))}

      {testNets.length > 0 && <TestnetDivider />}

      {testNets.map((chain) => renderMenuItem(chain.chainId, false))}

      {offerSafeCreation && isSafeOpened && addNetworkFeatureEnabled && (
        <UndeployedNetworks
          chains={configs}
          deployedChains={availableChainIds}
          safeAddress={safeAddress}
          closeNetworkSelect={handleClose}
        />
      )}
    </Select>
  ) : (
    <Skeleton width={94} height={31} sx={{ mx: 2 }} />
  )
}

export default NetworkSelector
