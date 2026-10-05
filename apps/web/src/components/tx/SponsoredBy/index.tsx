import chains from '@safe-global/utils/config/chains'
import type { SponsoredOption } from '@/utils/gasPayment'
import css from './styles.module.css'

export const RELAY_SPONSORS = {
  [chains.gno]: {
    name: 'Gnosis',
    logo: '/images/common/gnosis-chain-logo.png',
  },
  default: {
    name: 'Safe',
    logo: '/images/logo-no-text.svg',
  },
}

const SponsoredBy = ({ option, chainId }: { option: SponsoredOption; chainId: string }) => {
  const sponsor = (option === 'FREE_DAILY_LIMIT' && RELAY_SPONSORS[chainId]) || RELAY_SPONSORS.default

  return (
    <>
      <img src={sponsor.logo} alt={sponsor.name} className={css.logo} /> {sponsor.name}
    </>
  )
}

export default SponsoredBy
