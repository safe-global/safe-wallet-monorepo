import ChainIndicator from '@/components/common/ChainIndicator'
import SafenetIcon from '@/public/images/safenet/safenet-icon.svg'
import { Box } from '@mui/material'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import css from './styles.module.css'

const NetworkLogosList = ({
  networks,
  showHasMore = false,
  showHasSafenet = false,
}: {
  networks: Pick<ChainInfo, 'chainId'>[]
  showHasMore?: boolean
  showHasSafenet?: boolean
}) => {
  const MAX_NUM_VISIBLE_CHAINS = showHasSafenet ? 3 : 4
  const visibleChains = showHasMore ? networks.slice(0, MAX_NUM_VISIBLE_CHAINS) : networks

  return (
    <Box className={css.networks}>
      {visibleChains.map((chain) => (
        <ChainIndicator key={chain.chainId} chainId={chain.chainId} onlyLogo inline />
      ))}
      {showHasSafenet && (
        <Box className={css.safenetIndicator}>
          <SafenetIcon height="24" />
        </Box>
      )}
      {showHasMore && networks.length > MAX_NUM_VISIBLE_CHAINS && (
        <Box className={css.moreChainsIndicator}>+{networks.length - MAX_NUM_VISIBLE_CHAINS}</Box>
      )}
    </Box>
  )
}

export default NetworkLogosList
