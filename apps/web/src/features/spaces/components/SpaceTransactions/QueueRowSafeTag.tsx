import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { QueueSafeTag } from '@safe-global/views/features/spaces/components/SpaceQueue'
import { useChain } from '@/hooks/useChains'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'

const QueueRowSafeTag = ({ safeAddress, chainId }: { safeAddress: string; chainId: string }): ReactElement => {
  const name = useSafeDisplayName(safeAddress, chainId)
  const chain = useChain(chainId)
  return (
    <QueueSafeTag
      address={safeAddress}
      name={name || shortenAddress(safeAddress)}
      chainName={chain?.chainName}
      chainLogoUri={chain?.chainLogoUri ?? undefined}
    />
  )
}

export default QueueRowSafeTag
