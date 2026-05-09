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

  const fallback = fallbackSrc || FALLBACK_ICON

  return (
    <Box position="relative" marginRight={chainId ? '8px' : '0px'}>
      <IframeIcon
        src={src || fallback}
        alt={tokenSymbol ?? ''}
        width={size}
        height={size}
        borderRadius={noRadius ? undefined : '100%'}
        fallbackSrc={fallback}
      />
      {chainId && (
        <div className={css.chainIcon}>
          <ChainIndicator chainId={chainId} onlyLogo showLogo showUnknown imageSize={size * 0.666667} />
        </div>
      )}
      {badgeUri && (
        <div className={css.badge}>
          <IframeIcon src={badgeUri} alt="badge" width={12} height={12} borderRadius="100%" />
        </div>
      )}
    </Box>
  )
}

export default TokenIcon
