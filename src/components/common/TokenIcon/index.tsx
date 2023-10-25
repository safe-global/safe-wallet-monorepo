import { type ReactElement } from 'react'
import ImageFallback from '../ImageFallback'
import css from './styles.module.css'

const FALLBACK_ICON = '/images/common/token-placeholder.svg'

const CUSTOM_LOGO_MAP: Record<string, string> = {
  BNB: `https://www.bnbchainlist.org/static/images/rsz_bnb.svg`,
  TCBNB: `https://www.bnbchainlist.org/static/images/rsz_bnb.svg`,
  BTC: `https://raw.githubusercontent.com/bnb-chain/opbnb-bridge-tokens/main/data/BTCB/logo.svg`,
  BTCB: `https://raw.githubusercontent.com/bnb-chain/opbnb-bridge-tokens/main/data/BTCB/logo.svg`,
  USDT: `https://raw.githubusercontent.com/bnb-chain/opbnb-bridge-tokens/main/data/USDT/logo.svg`,
  FDUSD: `https://raw.githubusercontent.com/bnb-chain/opbnb-bridge-tokens/main/data/FDUSD/logo.jpeg`,
  ETH: `https://raw.githubusercontent.com/bnb-chain/opbnb-bridge-tokens/main/data/ETH/logo.svg`,
}

const TokenIcon = ({
  logoUri,
  tokenSymbol,
  size = 26,
  fallbackSrc,
}: {
  logoUri?: string
  tokenSymbol?: string
  size?: number
  fallbackSrc?: string
}): ReactElement => {
  let logoURL = logoUri
  if (tokenSymbol && CUSTOM_LOGO_MAP[tokenSymbol]) {
    logoURL = CUSTOM_LOGO_MAP[tokenSymbol]
  }

  return (
    <ImageFallback
      src={logoURL}
      alt={tokenSymbol}
      fallbackSrc={fallbackSrc || FALLBACK_ICON}
      height={size}
      className={css.image}
    />
  )
}

export default TokenIcon
