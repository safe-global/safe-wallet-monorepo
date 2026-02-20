import { Box, Tooltip, Typography } from '@mui/material'
import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosList } from '@/features/multichain'
import type { SafeItem } from '@/hooks/safes'
import css from '../AccountItems/styles.module.css'

export interface AccountItemChainBadgeProps {
  /** Single chain mode */
  chainId?: string
  /** Multi-chain mode - renders network logos with tooltip */
  safes?: SafeItem[]
}

function AccountItemChainBadge({ chainId, safes }: AccountItemChainBadgeProps) {
  // Multi-chain mode: render NetworkLogosList with tooltip
  if (safes && safes.length > 0) {
    return (
      <Box className={css.multiChains}>
        <Tooltip
          title={
            <Box data-testid="multichain-tooltip">
              <Typography fontSize="14px">Multichain account on:</Typography>
              {safes.map((safeItem) => (
                <Box key={safeItem.chainId} sx={{ p: '4px 0px' }}>
                  <ChainIndicator chainId={safeItem.chainId} />
                </Box>
              ))}
            </Box>
          }
          arrow
        >
          <Box>
            <NetworkLogosList networks={safes} showHasMore />
          </Box>
        </Tooltip>
      </Box>
    )
  }

  // Single chain mode: render ChainIndicator
  if (chainId) {
    return (
      <div className={css.accountItemChainBadge}>
        <ChainIndicator chainId={chainId} responsive onlyLogo className={css.chainIndicator} />
      </div>
    )
  }

  return null
}

export default AccountItemChainBadge
