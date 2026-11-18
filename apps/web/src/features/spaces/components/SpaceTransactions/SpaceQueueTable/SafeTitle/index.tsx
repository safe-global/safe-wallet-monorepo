import type { ReactElement } from 'react'
import SafeTitleView from '@safe-global/views/features/spaces/components/SpaceQueue/SafeTitle'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'

const SafeTitle = ({ safeAddress, chains }: { safeAddress: string; chains: ChainInfo[] }): ReactElement => {
  const name = useSafeDisplayName(safeAddress, chains[0]?.chainId ?? '')
  return <SafeTitleView safeAddress={safeAddress} name={name} chains={chains} />
}

export default SafeTitle
