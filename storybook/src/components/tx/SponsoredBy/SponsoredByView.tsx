import css from './styles.module.css'

export const SPONSORS = {
  gnosis: {
    name: 'Gnosis',
    logo: '/images/common/gnosis-chain-logo.png',
  },
  safe: {
    name: 'Safe',
    logo: '/images/logo-no-text.svg',
  },
}

export type SponsoredByViewProps = {
  sponsor: { name: string; logo: string }
}

export const SponsoredByView = ({ sponsor }: SponsoredByViewProps) => {
  return (
    <>
      <img src={sponsor.logo} alt={sponsor.name} className={css.logo} /> {sponsor.name}
    </>
  )
}
