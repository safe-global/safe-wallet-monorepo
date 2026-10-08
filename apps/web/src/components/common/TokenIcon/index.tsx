import { useMemo, type ReactElement } from 'react'
import { upgradeCoinGeckoThumbToQuality } from '@safe-global/utils/utils/image'
import ChainIndicator from '../ChainIndicator'
import { TokenIconView } from '@views/components/common/TokenIcon/TokenIconView'

const TokenIcon = ({
  logoUri,
  tokenSymbol,
  size = 26,
  fallbackSrc,
  chainId,
  noRadius,
  badgeUri,
}: {
  logoUri?: string
  tokenSymbol?: string | null
  size?: number
  fallbackSrc?: string
  chainId?: string
  noRadius?: boolean
  badgeUri?: string | null
}): ReactElement => {
  const src = useMemo(() => {
    return upgradeCoinGeckoThumbToQuality(logoUri || undefined, 'small')
  }, [logoUri])

  return (
    <TokenIconView
      src={src}
      tokenSymbol={tokenSymbol}
      size={size}
      fallbackSrc={fallbackSrc}
      chainId={chainId}
      noRadius={noRadius}
      badgeUri={badgeUri}
      renderChainIndicator={(props) => <ChainIndicator {...props} />}
    />
  )
}

export default TokenIcon
