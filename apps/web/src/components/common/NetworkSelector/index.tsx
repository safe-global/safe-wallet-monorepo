import ChainIndicator from '@/components/common/ChainIndicator'
import partition from 'lodash/partition'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import type { NextRouter } from 'next/router'
import { useRouter } from 'next/router'
import { type KeyboardEvent, type ReactElement, useCallback, useMemo, useRef, useState } from 'react'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { useAllSafesGrouped } from '@/hooks/safes'
import useSafeAddress from '@/hooks/useSafeAddress'
import { withSpaceId } from '@/hooks/useUrlSpaceId'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import uniq from 'lodash/uniq'
import { useCompatibleNetworks } from '@safe-global/utils/features/multichain/hooks/useCompatibleNetworks'
import { useSafeCreationData, CreateSafeOnSpecificChain, hasMultiChainAddNetworkFeature } from '@/features/multichain'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import type { ChainIndicatorSlotProps } from '@views/components/common/NetworkSelector/NetworkMultiSelectorInputView'
import {
  NetworkSelectorView,
  UndeployedNetworksView,
} from '@views/components/common/NetworkSelector/NetworkSelectorView'

const renderChainIndicator = (props: ChainIndicatorSlotProps) => <ChainIndicator {...props} />

const KEPT_QUERY_PARAMS = ['safeViewRedirectURL', 'appUrl', 'next'] as const

type KeptQuery = Partial<Record<(typeof KEPT_QUERY_PARAMS)[number], string>>

const pickKeptQuery = (query: NextRouter['query']): KeptQuery =>
  Object.fromEntries(
    KEPT_QUERY_PARAMS.flatMap((key) => {
      const value = query[key]
      return typeof value === 'string' && value ? [[key, value]] : []
    }),
  )

/** Links to the same page on the given chain; keeps only `spaceId` and KEPT_QUERY_PARAMS. */
export const buildChainSwitchHref = (
  router: Pick<NextRouter, 'pathname' | 'query'>,
  safeAddress: string,
  { shortName }: Pick<Chain, 'shortName'>,
) => {
  const target = safeAddress ? { safe: `${shortName}:${safeAddress}` } : { chain: shortName }

  return {
    pathname: router.pathname,
    query: withSpaceId({ ...target, ...pickKeptQuery(router.query) }, router.query.spaceId),
  }
}

const UndeployedNetworks = ({
  deployedChains,
  chains,
  safeAddress,
  closeNetworkSelect,
}: {
  deployedChains: string[]
  chains: Chain[]
  safeAddress: string
  closeNetworkSelect: () => void
}) => {
  const [open, setOpen] = useState(false)
  const [replayOnChain, setReplayOnChain] = useState<Chain>()
  const addressBook = useAddressBook()
  const safeName = addressBook[safeAddress]
  const { configs } = useChains()

  const deployedChainInfos = useMemo(
    () => chains.filter((chain) => deployedChains.includes(chain.chainId)),
    [chains, deployedChains],
  )
  const safeCreationResult = useSafeCreationData(safeAddress, deployedChainInfos)
  const [safeCreationData, safeCreationDataError, safeCreationLoading] = safeCreationResult

  const allCompatibleChains = useCompatibleNetworks(safeCreationData, configs)
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

  const onSelect = (chainId: string) => {
    setReplayOnChain(availableNetworks.find((chain) => chain.chainId === chainId))
  }

  const errorKind =
    safeCreationDataError || (safeCreationData && noAvailableNetworks)
      ? 'notPossible'
      : isUnsupportedSafeCreationVersion
        ? 'outdated'
        : undefined

  const onFormClose = () => {
    setReplayOnChain(undefined)
    closeNetworkSelect()
  }

  const onShowAllNetworks = () => {
    !open && trackEvent(OVERVIEW_EVENTS.SHOW_ALL_NETWORKS)
    setOpen((prev) => !prev)
  }

  return (
    <UndeployedNetworksView
      loading={Boolean(safeCreationLoading)}
      errorKind={errorKind}
      errorTooltip={safeCreationDataError?.message}
      open={open}
      onOpenChange={onShowAllNetworks}
      hasCreationData={!!safeCreationData}
      prodNets={prodNets}
      testNets={testNets}
      onSelect={onSelect}
      replayForm={
        replayOnChain &&
        safeCreationData && (
          <CreateSafeOnSpecificChain
            chain={replayOnChain}
            safeAddress={safeAddress}
            open
            onClose={onFormClose}
            currentName={safeName ?? ''}
            safeCreationResult={safeCreationResult}
          />
        )
      }
      renderChainIndicator={renderChainIndicator}
    />
  )
}

const NetworkSelector = ({
  onChainSelect,
  offerSafeCreation = false,
  compactButton = false,
  triggerClassName,
}: {
  onChainSelect?: () => void
  offerSafeCreation?: boolean
  compactButton?: boolean
  triggerClassName?: string
}): ReactElement => {
  const [open, setOpen] = useState<boolean>(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const rowRefs = useRef(new Map<string, HTMLElement>())

  const registerRow = useCallback(
    (chainId: string) => (node: HTMLElement | null) => {
      if (!node) return
      rowRefs.current.set(chainId, node)
      return () => {
        rowRefs.current.delete(chainId)
      }
    },
    [],
  )
  const { configs } = useChains()
  const chainId = useChainId()
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const currentChain = useCurrentChain()
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

  const query = search.trim().toLowerCase()

  const [testNets, prodNets] = useMemo(
    () =>
      partition(
        configs.filter(
          (config) =>
            availableChainIds.includes(config.chainId) && (!query || config.chainName.toLowerCase().includes(query)),
        ),
        (config) => config.isTestnet,
      ),
    [availableChainIds, configs, query],
  )

  const toMenuItem = (chain: Chain) => ({
    chainId: chain.chainId,
    href: buildChainSwitchHref(router, safeAddress, chain),
  })

  const onItemClick = (itemChainId: string) => {
    trackEvent({ ...OVERVIEW_EVENTS.SWITCH_NETWORK, label: itemChainId })
    onChainSelect?.()
  }

  // base-ui's highlighted-row index goes stale when the list shrinks; focusing a row resets it via onFocus.
  const focusRow = (edge: 'first' | 'last') => {
    const rendered = [...prodNets, ...testNets]
    const chain = edge === 'first' ? rendered[0] : rendered[rendered.length - 1]
    if (!chain) return
    rowRefs.current.get(chain.chainId)?.focus()
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      focusRow(event.key === 'ArrowDown' ? 'first' : 'last')
      return
    }

    // base-ui reads printable keys as list typeahead, which would take over the field; Escape must still reach it.
    if (event.key !== 'Escape') {
      event.stopPropagation()
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    // This component stays mounted across close, so the next opening would start filtered.
    setSearch('')
    if (nextOpen) {
      offerSafeCreation && trackEvent({ ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE, label: OVERVIEW_LABELS.top_bar })
    }
  }

  const handleClose = () => {
    handleOpenChange(false)
  }

  return (
    <NetworkSelectorView
      isLoading={!configs.length}
      open={open}
      onOpenChange={handleOpenChange}
      chainId={chainId}
      selectedChainId={configs.find((chain) => chain.chainId === chainId)?.chainId}
      compactButton={compactButton}
      triggerClassName={triggerClassName}
      searchRef={searchRef}
      search={search}
      onSearchChange={(e) => setSearch(e.target.value)}
      onSearchClear={() => setSearch('')}
      onSearchKeyDown={handleSearchKeyDown}
      prodNets={prodNets.map(toMenuItem)}
      testNets={testNets.map(toMenuItem)}
      registerRow={registerRow}
      onItemClick={onItemClick}
      showEmpty={Boolean(query) && prodNets.length === 0 && testNets.length === 0}
      undeployedNetworks={
        !query &&
        offerSafeCreation &&
        isSafeOpened &&
        addNetworkFeatureEnabled && (
          <UndeployedNetworks
            chains={configs}
            deployedChains={availableChainIds}
            safeAddress={safeAddress}
            closeNetworkSelect={handleClose}
          />
        )
      }
      renderChainIndicator={renderChainIndicator}
    />
  )
}

export default NetworkSelector
