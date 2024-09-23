import ChainIndicator from '@/components/common/ChainIndicator'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppSelector } from '@/store'
import { selectChains } from '@/store/chainsSlice'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import type { SelectChangeEvent } from '@mui/material'
import {
  Box,
  ButtonBase,
  CircularProgress,
  Collapse,
  Divider,
  ListSubheader,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import partition from 'lodash/partition'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import useChains from '@/hooks/useChains'
import type { NextRouter } from 'next/router'
import { useRouter } from 'next/router'
import css from './styles.module.css'
import { useChainId } from '@/hooks/useChainId'
import { type ReactElement, useCallback, useMemo, useState } from 'react'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'

import { useAllSafesGrouped } from '@/components/welcome/MyAccounts/useAllSafesGrouped'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@/utils/addresses'
import uniq from 'lodash/uniq'
import useSafeOverviews from '@/components/welcome/MyAccounts/useSafeOverviews'
import { useCompatibleNetworks } from '@/features/multichain/hooks/useCompatibleNetworks'
import { useSafeCreationData } from '@/features/multichain/hooks/useSafeCreationData'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import PlusIcon from '@/public/images/common/plus.svg'
import useAddressBook from '@/hooks/useAddressBook'
import { CreateSafeOnSpecificChain } from '@/features/multichain/components/CreateSafeOnNewChain'

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
  }

  const route = {
    pathname: router.pathname,
    query,
  }

  if (router.query?.safeViewRedirectURL) {
    route.query.safeViewRedirectURL = router.query?.safeViewRedirectURL.toString()
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
  )
}

const NetworkSkeleton = () => {
  return (
    <Stack direction="row" spacing={1} alignItems="center" p="4px 0px">
      <Skeleton variant="circular" width="24px" height="24px" />
      <Skeleton variant="rounded" sx={{ flexGrow: 1 }} />
    </Stack>
  )
}

const TestnetDivider = () => {
  return (
    <Divider sx={{ m: '0px !important', '& .MuiDivider-wrapper': { p: '0px 16px' } }}>
      <Typography variant="overline" color="border.main">
        Testnets
      </Typography>
    </Divider>
  )
}

const UndeployedNetworks = ({
  deployedChains,
  chains,
  safeAddress,
}: {
  deployedChains: string[]
  chains: ChainInfo[]
  safeAddress: string
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
    () => allCompatibleChains?.filter((config) => !deployedChains.includes(config.chainId)) || [],
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
      <Box display="flex" alignItems="center" justifyContent="center" my={1}>
        <CircularProgress size={18} />
      </Box>
    )
  }

  const errorMessage =
    safeCreationDataError || (safeCreationData && noAvailableNetworks)
      ? 'Adding another network is not possible for this Safe.'
      : isUnsupportedSafeCreationVersion
      ? 'This account was created from an outdated mastercopy. Adding another network is not possible.'
      : ''

  if (errorMessage) {
    return (
      <Box px={2} py={1}>
        <Typography color="text.secondary" fontSize="14px" maxWidth={300}>
          {errorMessage}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <ListSubheader className={css.undeployedNetworksHeader}>
        <ButtonBase className={css.listSubHeader} onClick={() => setOpen((prev) => !prev)}>
          <Stack direction="row" spacing={1} alignItems="center">
            <div>Show all networks</div>
            <ExpandMoreIcon
              fontSize="small"
              sx={{
                transform: open ? 'rotate(180deg)' : undefined,
              }}
            />
          </Stack>
        </ButtonBase>
      </ListSubheader>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {!safeCreationData ? (
          <Box p="0px 16px">
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
          onClose={() => setReplayOnChain(undefined)}
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
  const isDarkMode = useDarkMode()
  const theme = useTheme()
  const { configs } = useChains()
  const chainId = useChainId()
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const chains = useAppSelector(selectChains)

  const isSafeOpened = safeAddress !== ''

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

  const multiChainSafes = useMemo(
    () => availableChainIds.map((chain) => ({ address: safeAddress, chainId: chain })),
    [availableChainIds, safeAddress],
  )
  const [safeOverviews] = useSafeOverviews(multiChainSafes)

  const onChange = (event: SelectChangeEvent) => {
    event.preventDefault() // Prevent the link click

    const newChainId = event.target.value
    const shortName = configs.find((item) => item.chainId === newChainId)?.shortName

    if (shortName) {
      trackEvent({ ...OVERVIEW_EVENTS.SWITCH_NETWORK, label: newChainId })
      const networkLink = getNetworkLink(router, safeAddress, shortName)
      router.push(networkLink)
    }
  }

  const renderMenuItem = useCallback(
    (chainId: string, isSelected: boolean) => {
      const chain = chains.data.find((chain) => chain.chainId === chainId)
      const safeOverview = safeOverviews?.find((overview) => chainId === overview.chainId)

      if (!chain) return null

      return (
        <MenuItem key={chainId} value={chainId} sx={{ '&:hover': { backgroundColor: 'inherit' } }}>
          <Link
            href={getNetworkLink(router, safeAddress, chain.shortName)}
            onClick={onChainSelect}
            className={css.item}
          >
            <ChainIndicator
              responsive={isSelected}
              chainId={chain.chainId}
              fiatValue={safeOverview ? safeOverview.fiatTotal : undefined}
              inline
            />
          </Link>
        </MenuItem>
      )
    },
    [chains.data, onChainSelect, router, safeAddress, safeOverviews],
  )

  return configs.length ? (
    <Select
      value={chainId}
      onChange={onChange}
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
            minWidth: '250px !important',
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

      {offerSafeCreation && isSafeOpened && (
        <UndeployedNetworks chains={configs} deployedChains={availableChainIds} safeAddress={safeAddress} />
      )}
    </Select>
  ) : (
    <Skeleton width={94} height={31} sx={{ mx: 2 }} />
  )
}

export default NetworkSelector
