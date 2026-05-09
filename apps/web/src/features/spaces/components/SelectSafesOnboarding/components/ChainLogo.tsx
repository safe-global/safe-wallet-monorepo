import { useChain } from '@/hooks/useChains'

const ChainLogo = ({ chainId, size = 24 }: { chainId: string; size?: number }) => {
  const chainConfig = useChain(chainId)

  if (!chainConfig?.chainLogoUri) return null

  return (
    <img
      src={chainConfig.chainLogoUri}
      alt={`${chainConfig.chainName} logo`}
      width={size}
      height={size}
      className="rounded-full border-2 border-background"
      loading="lazy"
    />
  )
}

export default ChainLogo
