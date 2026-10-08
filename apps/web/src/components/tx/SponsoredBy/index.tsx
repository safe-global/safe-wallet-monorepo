import chains from '@safe-global/utils/config/chains'
import type { SponsoredOption } from '@/utils/gasPayment'
import { SPONSORS, SponsoredByView } from '@views/components/tx/SponsoredBy/SponsoredByView'

export const RELAY_SPONSORS = {
  [chains.gno]: SPONSORS.gnosis,
  default: SPONSORS.safe,
}

const SponsoredBy = ({ option, chainId }: { option: SponsoredOption; chainId: string }) => {
  const sponsor = (option === 'FREE_DAILY_LIMIT' && RELAY_SPONSORS[chainId]) || RELAY_SPONSORS.default

  return <SponsoredByView sponsor={sponsor} />
}

export default SponsoredBy
