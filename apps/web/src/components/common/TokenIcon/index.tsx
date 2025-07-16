import { useMemo, type ReactElement } from 'react'
import ImageFallback from '../ImageFallback'
import css from './styles.module.css'
import { upgradeCoinGeckoThumbToQuality } from '@safe-global/utils/utils/image'
import { Box } from '@mui/material'
import ChainIndicator from '../ChainIndicator'

const FALLBACK_ICON = '/images/common/token-placeholder.svg'

const TokenIcon = ({
  logoUri,
  tokenSymbol,
  size = 26,
  fallbackSrc,
  chainId,
}: {
  logoUri?: string
  tokenSymbol?: string
  size?: number
  fallbackSrc?: string
  chainId?: string
}): ReactElement => {
  const src = useMemo(() => {
    return upgradeCoinGeckoThumbToQuality(logoUri, 'small')
  }, [logoUri])

  return (
    <Box position="relative" marginRight={chainId ? '8px' : '0px'}>
      <ImageFallback
        src={src}
        alt={tokenSymbol}
        fallbackSrc={fallbackSrc || FALLBACK_ICON}
        height={size}
        className={css.image}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
      {chainId && (
        <div className={css.chainIcon}>
          <ChainIndicator chainId={chainId} onlyLogo showLogo showUnknown imageSize={size * 0.666667} />
        </div>
      )}
    </Box>
  )
}

export default TokenIcon
