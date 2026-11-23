import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import QueueSafeTag from '@safe-global/views/features/spaces/components/SpaceQueue/QueueSafeTag'
import useChains from '@/hooks/useChains'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import { toChainInfos } from '../../utils'

const QueueRowSafeTag = ({ safeAddress, chainId }: { safeAddress: string; chainId: string }): ReactElement => {
  const name = useSafeDisplayName(safeAddress, chainId)
  const { configs } = useChains()
  return (
    <QueueSafeTag
      address={safeAddress}
      // Short enough to fit the Safe column whole, so the address suffix stays readable
      name={name || shortenAddress(safeAddress, 3)}
      chain={toChainInfos([chainId], configs)[0]}
    />
  )
}

export default QueueRowSafeTag
