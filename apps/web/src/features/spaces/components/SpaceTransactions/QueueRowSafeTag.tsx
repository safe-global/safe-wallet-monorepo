import type { MouseEvent, ReactElement } from 'react'
import { useRouter } from 'next/router'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@safe-global/views/components/common/Identicon'
import QueueSafeTag from '@safe-global/views/features/spaces/components/SpaceQueue/QueueSafeTag'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { useUrlSpaceId, withSpaceIdInUrl } from '@/hooks/useUrlSpaceId'
import { toChainInfos } from '../../utils'
import PartyCard from './QueueParty/PartyCard'

const isModifiedClick = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

const QueueRowSafeTag = ({ safeAddress, chainId }: { safeAddress: string; chainId: string }): ReactElement => {
  const name = useSafeDisplayName(safeAddress, chainId)
  const { configs } = useChains()
  const router = useRouter()
  const spaceId = useUrlSpaceId()
  const chain = toChainInfos([chainId], configs)[0]
  // Without a chain config the short name is unknown, so there is no Safe URL to link to
  const shortName = configs.find((config) => config.chainId === chainId)?.shortName
  const href = shortName ? withSpaceIdInUrl(`${AppRoutes.home}?safe=${shortName}:${safeAddress}`, spaceId) : undefined

  const onNavigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href || isModifiedClick(event)) return
    event.preventDefault()
    void router.push(href)
  }

  return (
    <QueueSafeTag
      address={safeAddress}
      // Short enough to fit the Safe column whole, so the address suffix stays readable
      name={name || shortenAddress(safeAddress, 3)}
      chain={chain}
      href={href}
      onNavigate={onNavigate}
      card={
        <PartyCard
          address={safeAddress}
          chainId={chainId}
          name={name || undefined}
          network={chain?.chainName}
          avatar={<Identicon address={safeAddress} size={32} />}
        />
      }
    />
  )
}

export default QueueRowSafeTag
