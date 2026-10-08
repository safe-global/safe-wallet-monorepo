import type { ReactElement } from 'react'

import Identicon, { type IdenticonProps } from '../Identicon'
import { useChain } from '@/hooks/useChains'
import { ChainIconView, SafeIconView, type SafeIconViewProps } from '@views/components/common/SafeIcon/SafeIconView'

interface SafeIconProps extends IdenticonProps {
  threshold?: SafeIconViewProps['threshold']
  owners?: SafeIconViewProps['owners']
  size?: number
  chainId?: string
  isMultiChainItem?: boolean
}

export const ChainIcon = ({ chainId }: { chainId: string }) => {
  const chainConfig = useChain(chainId)

  return <ChainIconView chain={chainConfig} />
}

const SafeIcon = ({
  address,
  threshold,
  owners,
  size,
  chainId,
  isMultiChainItem = false,
}: SafeIconProps): ReactElement => {
  return (
    <SafeIconView
      threshold={threshold}
      owners={owners}
      icon={isMultiChainItem && chainId ? <ChainIcon chainId={chainId} /> : <Identicon address={address} size={size} />}
    />
  )
}

export default SafeIcon
