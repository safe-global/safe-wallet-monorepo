import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const PortfolioRefreshHint = gatedDynamic(
  FEATURES.PORTFOLIO_ENDPOINT,
  () => import('../components/PortfolioRefreshHint'),
)

export default PortfolioRefreshHint
