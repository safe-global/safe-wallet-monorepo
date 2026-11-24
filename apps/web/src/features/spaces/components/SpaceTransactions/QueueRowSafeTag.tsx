import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@safe-global/views/components/common/Identicon'
import QueueSafeTag from '@safe-global/views/features/spaces/components/SpaceQueue/QueueSafeTag'
import useChains from '@/hooks/useChains'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { toChainInfos } from '../../utils'
import PartyCard from './QueueParty/PartyCard'

const QueueRowSafeTag = ({ safeAddress, chainId }: { safeAddress: string; chainId: string }): ReactElement => {
  const name = useSafeDisplayName(safeAddress, chainId)
  const { configs } = useChains()
  const chain = toChainInfos([chainId], configs)[0]
  return (
    <QueueSafeTag
      address={safeAddress}
      // Short enough to fit the Safe column whole, so the address suffix stays readable
      name={name || shortenAddress(safeAddress, 3)}
      chain={chain}
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
