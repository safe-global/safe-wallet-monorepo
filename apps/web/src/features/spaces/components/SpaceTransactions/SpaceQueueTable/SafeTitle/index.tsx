import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import SafeBandTitle, {
  SafeBandCard,
  type SafeBandChain,
} from '@safe-global/views/features/spaces/components/SpaceQueue/SafeBandTitle'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useAppSelector } from '@/store'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { selectCurrency } from '@/store/settingsSlice'
import type { SpaceQueueSection } from '../../../../hooks/useSpaceQueue'
import { useSignerWallets } from '../../../../hooks/useSignerWallets'
import { getNextNonce, getSafeBandDetails, getSectionRows } from '../../utils'

type SafeTitleProps = {
  section: SpaceQueueSection
  chains: ChainInfo[]
  /** The band's transactions are hidden */
  collapsed: boolean
  collapsedChainIds: string[]
  onFocusChain: (chainId: string) => void
}

/** Mounted only while the card is open, so the Safe's overviews load on demand */
const SafeCardContent = ({
  section,
  chains,
  name,
}: {
  section: SpaceQueueSection
  chains: ChainInfo[]
  name: string
}) => {
  const { safeAddress } = section
  const currency = useAppSelector(selectCurrency)
  const { currentData: overviews } = useGetMultipleSafeOverviewsQuery({
    safes: section.chains.map(({ chainId }) => ({ chainId, address: safeAddress })),
    currency,
  })
  const wallets = useSignerWallets()
  const resolveName = useSafeNameResolver()

  const facts = section.chains.map(({ chainId, items }) => {
    const overview = overviews?.find((item) => item.chainId === chainId && sameAddress(item.address.value, safeAddress))
    return {
      chainId,
      chainName: chains.find((chain) => chain.chainId === chainId)?.chainName ?? chainId,
      nextNonce: getNextNonce(getSectionRows(items)),
      threshold: overview?.threshold,
      owners: overview?.owners.length,
      signers: (overview?.owners ?? []).filter(({ value }) => wallets.has(value.toLowerCase())),
    }
  })
  const signerNames = [
    ...new Set(
      facts.flatMap(({ chainId, signers }) =>
        signers.map(({ value, name }) => resolveName(value, chainId) || name || shortenAddress(value)),
      ),
    ),
  ]

  return <SafeBandCard name={name} address={safeAddress} details={getSafeBandDetails(facts, signerNames)} />
}

const SafeTitle = ({ section, chains, collapsed, collapsedChainIds, onFocusChain }: SafeTitleProps): ReactElement => {
  const { safeAddress } = section
  const name = useSafeDisplayName(safeAddress, chains[0]?.chainId ?? '') || shortenAddress(safeAddress)
  const isCollapsed = (chainId: string) => collapsed || collapsedChainIds.includes(chainId)
  const isOnlyOpen = (chainId: string) =>
    !collapsed && chains.every((chain) => isCollapsed(chain.chainId) === (chain.chainId !== chainId))

  const chainButtons: SafeBandChain[] = chains.map((chain) => ({
    chain,
    collapsed: isCollapsed(chain.chainId),
    label:
      isOnlyOpen(chain.chainId) && chains.length > 1 ? `Show all ${chains.length} networks` : `Show ${chain.chainName}`,
    onClick: () => onFocusChain(chain.chainId),
  }))

  return (
    <SafeBandTitle
      safeAddress={safeAddress}
      name={name}
      chains={chainButtons}
      card={<SafeCardContent section={section} chains={chains} name={name} />}
    />
  )
}

export default SafeTitle
