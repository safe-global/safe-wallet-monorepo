import type { ReactElement } from 'react'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useChain } from '@/hooks/useChains'
import { ChainIndicatorView } from '@views/components/common/ChainIndicator/ChainIndicatorView'

type ChainIndicatorProps = {
  chainId?: string
  inline?: boolean
  className?: string
  showUnknown?: boolean
  showLogo?: boolean
  onlyLogo?: boolean
  responsive?: boolean
  fiatValue?: string
  imageSize?: number
}

const ChainIndicator = ({
  chainId,
  fiatValue,
  className,
  inline = false,
  showUnknown = true,
  showLogo = true,
  responsive = false,
  onlyLogo = false,
  imageSize = 24,
}: ChainIndicatorProps): ReactElement | null => {
  const currentChainId = useChainId()
  const id = chainId || currentChainId
  const { configs: chains } = useChains()
  const chain = useChain(id)

  return (
    <ChainIndicatorView
      chain={chain}
      isLoading={chains.length === 0}
      fiatValue={fiatValue}
      indicatorClassName={className}
      inline={inline}
      showUnknown={showUnknown}
      showLogo={showLogo}
      responsive={responsive}
      onlyLogo={onlyLogo}
      imageSize={imageSize}
    />
  )
}

export default ChainIndicator
