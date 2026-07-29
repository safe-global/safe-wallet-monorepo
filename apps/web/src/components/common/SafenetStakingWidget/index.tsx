import { SAFE_TOKEN_ADDRESSES } from '@/config/constants'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { useOpenSafenetStakingApp } from '@/hooks/useOpenSafenetStakingApp'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { Box, ButtonBase, CircularProgress, Skeleton, Tooltip, Typography } from '@mui/material'
import SafeTokenIcon from '@/public/images/common/safe-token.svg'
import css from './styles.module.css'

const SafenetStakingWidget = () => {
  const chainId = useChainId()
  const { balances, loading } = useBalances()
  const { openSafenetStakingApp, isNavigating } = useOpenSafenetStakingApp()

  const safeTokenAddress = SAFE_TOKEN_ADDRESSES[chainId]
  const safeTokenItem = balances.items.find(
    (item) => item.tokenInfo.address.toLowerCase() === safeTokenAddress?.toLowerCase(),
  )
  const safeBalance = safeTokenItem
    ? formatVisualAmount(safeTokenItem.balance, safeTokenItem.tokenInfo.decimals, 0)
    : '0'

  return (
    <Box className={css.container}>
      <Tooltip title="Go to Safenet Staking">
        <span>
          <ButtonBase
            aria-label="Safenet Staking"
            className={css.tokenButton}
            onClick={openSafenetStakingApp}
            disabled={isNavigating}
          >
            {isNavigating ? <CircularProgress size={16} color="inherit" /> : <SafeTokenIcon width={24} height={24} />}
            <Typography component="div" variant="body2" lineHeight={1}>
              {loading ? <Skeleton width="16px" animation="wave" /> : safeBalance}
            </Typography>
          </ButtonBase>
        </span>
      </Tooltip>
    </Box>
  )
}

export default SafenetStakingWidget
