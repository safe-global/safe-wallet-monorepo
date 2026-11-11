import type { ReactElement } from 'react'
import { useChain } from '@/hooks/useChains'

const ChainLogo = ({ chainId }: { chainId: string }): ReactElement | null => {
  const chain = useChain(chainId)
  if (!chain?.chainLogoUri) return null
  return (
    <img
      src={chain.chainLogoUri}
      alt={chain.chainName}
      title={chain.chainName}
      className="size-4 rounded-full ring-2 ring-card"
    />
  )
}

export default ChainLogo
