import ChainIndicator from '@/components/common/ChainIndicator'
import Track from '@/components/common/Track'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import partition from 'lodash/partition'
import { ChevronDownIcon, InfoIcon } from 'lucide-react'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import type { NextRouter } from 'next/router'
import { useRouter } from 'next/router'
import css from './styles.module.css'
import { type ReactElement, useCallback, useMemo, useState } from 'react'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { useAllSafesGrouped } from '@/hooks/safes'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import uniq from 'lodash/uniq'
import { useCompatibleNetworks } from '@safe-global/utils/features/multichain/hooks/useCompatibleNetworks'
import { useSafeCreationData, CreateSafeOnSpecificChain, hasMultiChainAddNetworkFeature } from '@/features/multichain'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import PlusIcon from '@/public/images/common/plus.svg'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import { cn } from '@/utils/cn'

export const getNetworkLink = (
  router: NextRouter,
  safeAddress: string,
  chainInfo: Pick<Chain, 'chainId' | 'shortName'>,
) => {
  const { shortName } = chainInfo
  const isSafeOpened = safeAddress !== ''

  const query = (
    isSafeOpened
      ? {
          safe: `${shortName}:${safeAddress}`,
        }
      : { chain: shortName }
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

  const queryParams = ['safeViewRedirectURL', 'appUrl'] as const

  for (const key of queryParams) {
    if (router.query?.[key]) {
      route.query[key] = router.query?.[key].toString()
    }
  }

  return route
}

const UndeployedNetworkMenuItem = ({
  chain,
  isSelected = false,
  onSelect,
}: {
  chain: Chain & { available: boolean }
  isSelected?: boolean
  onSelect: (chain: Chain) => void
}) => {
  const isDisabled = !chain.available

  return (
    <Track {...OVERVIEW_EVENTS.ADD_NEW_NETWORK} label={OVERVIEW_LABELS.top_bar}>
      <Tooltip>
        <TooltipTrigger
          data-testid="add-network-tooltip"
          render={
            <button
              type="button"
              className={css.undeployedItem}
              onClick={() => !isDisabled && onSelect(chain)}
              disabled={isDisabled}
            />
          }
        >
          <span className={css.item}>
            <ChainIndicator responsive={isSelected} chainId={chain.chainId} inline />
            {isDisabled ? (
              <Typography variant="paragraph-mini" className={css.comingSoon}>
                Not available
              </Typography>
            ) : (
              <PlusIcon className={css.plusIcon} />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left">Add network</TooltipContent>
      </Tooltip>
    </Track>
  )
}

const NetworkSkeleton = () => {
  return (
    <div className="flex items-center gap-2 py-1">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 grow rounded-md" />
    </div>
  )
}

const TestnetDivider = () => {
  return (
    <div className="my-0 flex items-center gap-2 px-4">
      <Separator className="flex-1" />
      <Typography variant="paragraph-mini" className="text-[var(--color-border-main)] uppercase">
        Testnets
      </Typography>
      <Separator className="flex-1" />
    </div>
  )
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

  const onSelect = (chain: Chain) => {
    setReplayOnChain(chain)
  }

  if (safeCreationLoading) {
    return (
      <div className="my-2 flex items-center justify-center">
        <Spinner className="size-[18px]" />
      </div>
    )
  }

  const errorMessage =
    safeCreationDataError || (safeCreationData && noAvailableNetworks) ? (
      <div className="flex items-center gap-2">
        {safeCreationDataError?.message && (
          <Tooltip>
            <TooltipTrigger render={<InfoIcon className="text-[var(--color-info-main)] size-5" />} />
            <TooltipContent>{safeCreationDataError?.message}</TooltipContent>
          </Tooltip>
        )}
        <Typography>Adding another network is not possible for this Safe. </Typography>
      </div>
    ) : isUnsupportedSafeCreationVersion ? (
      'This account was created from an outdated mastercopy. Adding another network is not possible.'
    ) : (
      ''
    )

  if (errorMessage) {
    return (
      <div className="px-4 py-2">
        <Typography className="text-muted-foreground max-w-[300px] text-sm">{errorMessage}</Typography>
      </div>
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
    <Collapsible open={open} onOpenChange={onShowAllNetworks}>
      <CollapsibleTrigger className={css.listSubHeader} tabIndex={-1}>
        <span className="flex items-center gap-2">
          <span data-testid="show-all-networks">Show all networks</span>

          <ChevronDownIcon className={open ? 'size-4 rotate-180' : 'size-4'} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {!safeCreationData ? (
          <div className="px-4">
            <NetworkSkeleton />
            <NetworkSkeleton />
          </div>
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
      </CollapsibleContent>
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
    </Collapsible>
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
      const chain = configs.find((chain) => chain.chainId === chainId)
      if (!chain) return null

      const onSwitchNetwork = () => {
        trackEvent({ ...OVERVIEW_EVENTS.SWITCH_NETWORK, label: chainId })
      }

      return (
        <SelectItem data-testid="network-selector-item" key={chainId} value={chainId} className={css.menuItem}>
          <Link
            href={getNetworkLink(router, safeAddress, chain)}
            onClick={() => {
              onSwitchNetwork()
              onChainSelect?.()
            }}
            className={css.item}
          >
            <ChainIndicator
              responsive={isSelected}
              chainId={chain.chainId}
              inline
              onlyLogo={compactButton && isSelected}
            />
          </Link>
        </SelectItem>
      )
    },
    [configs, onChainSelect, router, safeAddress, compactButton],
  )

  const handleClose = () => {
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      offerSafeCreation && trackEvent({ ...OVERVIEW_EVENTS.EXPAND_MULTI_SAFE, label: OVERVIEW_LABELS.top_bar })
    }
  }

  const renderSelectedValue = () => {
    const chain = configs.find((chain) => chain.chainId === chainId)
    if (!chain) return null
    return <ChainIndicator responsive chainId={chain.chainId} inline onlyLogo={compactButton} />
  }

  return configs.length ? (
    <Select open={open} onOpenChange={handleOpenChange} value={chainId}>
      <SelectTrigger
        className={cn(triggerClassName ?? css.select)}
        iconWrapperClassName={compactButton ? 'text-base' : undefined}
        aria-label="Network"
      >
        <SelectValue>{renderSelectedValue}</SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[260px]" alignItemWithTrigger={false}>
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
      </SelectContent>
    </Select>
  ) : (
    <Skeleton className="mx-2 h-[31px] w-[94px]" />
  )
}

export default NetworkSelector
