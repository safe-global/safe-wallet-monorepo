import SafenetIcon from '@/public/images/safenet/safenet-icon.svg'
import { useMemo, type ReactElement } from 'react'
import ImageFallback from '../ImageFallback'
import css from './styles.module.css'
const FALLBACK_ICON = '/images/common/token-placeholder.svg'
const COINGECKO_THUMB = '/thumb/'
const COINGECKO_SMALL = '/small/'

const TokenIcon = ({
  logoUri,
  tokenSymbol,
  safenet,
  size = 26,
  fallbackSrc,
}: {
  logoUri?: string
  tokenSymbol?: string
  safenet?: boolean
  size?: number
  fallbackSrc?: string
}): ReactElement => {
  const src = useMemo(() => {
    return logoUri?.replace(COINGECKO_THUMB, COINGECKO_SMALL)
  }, [logoUri])

  return (
    <div className={`${css.container} ${safenet && css.additionalMargin}`}>
      <ImageFallback
        src={src}
        alt={tokenSymbol}
        fallbackSrc={fallbackSrc || FALLBACK_ICON}
        height={size}
        className={css.image}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
      {safenet && (
        <div className={css.safenetContainer}>
          <SafenetIcon height="20" />
        </div>
      )}
    </div>
  )
}

export default TokenIcon
