import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { NetworkBadge } from '@/src/components/NetworkBadge'

type Props = {
  chainId: string
  size?: 'small' | 'medium' | 'large'
}
export const NetworkBadgeContainer = ({ chainId }: Props) => {
  const chain = useAppSelector((state) => selectChainById(state, chainId))
  if (!chain) {
    return null
  }

  return <NetworkBadge network={chain} />
}
