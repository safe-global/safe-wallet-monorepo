import ChainIndicator from '@/components/common/ChainIndicator'

export interface ChainLogoProps {
  chainId: string
  size?: number
}

const ChainLogo = ({ chainId, size = 22 }: ChainLogoProps) => (
  <span className="size-6 rounded-full overflow-hidden shrink-0 inline-flex items-center justify-center [&_img]:rounded-full">
    <ChainIndicator chainId={chainId} imageSize={size} showLogo onlyLogo />
  </span>
)

export default ChainLogo
