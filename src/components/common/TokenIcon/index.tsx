import { type ReactElement } from 'react'
import ImageFallback from '../ImageFallback'
import css from './styles.module.css'
import Image from 'next/image'

const FALLBACK_ICON = '/images/common/token-placeholder.svg'

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
  return (
    <div className={css.container}>
      <ImageFallback
        src={logoUri}
        alt={tokenSymbol}
        fallbackSrc={fallbackSrc || FALLBACK_ICON}
        height={size}
        className={css.image}
      />
      {safenet && (
        <div className={css.safenetContainer}>
          <Image src="/images/safenet-bright.svg" alt="Safenet Logo" width={12} height={12} />
        </div>
      )}
    </div>
  )
}

export default TokenIcon
