import chains from '@/config/chains'
import css from './styles.module.css'

export const RELAY_SPONSORS = {
  [chains.gno]: {
    name: 'Gnosis',
    logo: '/images/common/gnosis-chain-logo.png',
  },
  default: {
    name: '',
    logo: '/images/logo-no-text.svg',
  },
}

const SponsoredBy = ({ chainId }: { chainId: string }) => {
  const sponsor = RELAY_SPONSORS[chainId] || RELAY_SPONSORS.default

  return (
    <>
      <img src={sponsor.logo} alt={sponsor.name} className={css.logo} /> {sponsor.name}
    </>
  )
}

export default SponsoredBy
