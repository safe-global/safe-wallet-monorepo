import ChainIndicator from '@/components/common/ChainIndicator'
import { Box } from '@mui/material'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import css from './styles.module.css'

const NetworkLogosList = ({
  networks,
  showHasMore = false,
  maxVisible = 4,
}: {
  networks: Pick<Chain, 'chainId'>[]
  showHasMore?: boolean
  maxVisible?: number
}) => {
  const visibleChains = showHasMore ? networks.slice(0, maxVisible) : networks

  return (
    <Box className={css.networks}>
      {visibleChains.map((chain) => (
        <ChainIndicator key={chain.chainId} chainId={chain.chainId} onlyLogo inline />
      ))}
      {showHasMore && networks.length > maxVisible && (
        <Box className={css.moreChainsIndicator}>+{networks.length - maxVisible}</Box>
      )}
    </Box>
  )
}

export default NetworkLogosList
