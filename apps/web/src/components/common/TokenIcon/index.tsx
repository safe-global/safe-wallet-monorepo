import { useMemo, type ReactElement } from 'react'
import IframeIcon from '../IframeIcon'
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
  tokenSymbol?: string | null
  size?: number
  fallbackSrc?: string
  chainId?: string
}): ReactElement => {
  const src = useMemo(() => {
    return upgradeCoinGeckoThumbToQuality(logoUri || undefined, 'small')
  }, [logoUri])

  return (
    <Box position="relative" marginRight={chainId ? '8px' : '0px'}>
      <IframeIcon
        src={src || fallbackSrc || FALLBACK_ICON}
        alt={tokenSymbol ?? ''}
        width={size}
        height={size}
        borderRadius="100%"
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
