import ChainIndicator from '@/components/common/ChainIndicator'

export interface ChainLogoProps {
  chainId: string
  size?: number
}

const ChainLogo = ({ chainId, size = 22 }: ChainLogoProps) => (
  <span className="size-6 rounded-full border border-border overflow-hidden shrink-0 inline-flex items-center justify-flex-start bg-background">
    <ChainIndicator chainId={chainId} imageSize={size} showLogo onlyLogo />
  </span>
)

export default ChainLogo
