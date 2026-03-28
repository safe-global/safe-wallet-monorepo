import { AppRoutes } from '@/config/routes'
import { SAFE_TOKEN_ADDRESSES } from '@/config/constants'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'

export const getSafeTokenAddress = (chainId: string): string | undefined => {
  return SAFE_TOKEN_ADDRESSES[chainId]
}
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { Box, ButtonBase, Skeleton, Tooltip, Typography } from '@mui/material'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import SafeTokenIcon from '@/public/images/common/safe-token.svg'
import css from './styles.module.css'

const SAFENET_STAKING_APP_URL = 'https://staking.safe-beta.eth.limo'

const SafenetStakingWidget = () => {
  const query = useSearchParams()
  const chainId = useChainId()
  const { balances, loading } = useBalances()

  const safeTokenAddress = SAFE_TOKEN_ADDRESSES[chainId]
  const safeTokenItem = balances.items.find(
    (item) => item.tokenInfo.address.toLowerCase() === safeTokenAddress?.toLowerCase(),
  )
  const safeBalance = safeTokenItem
    ? formatVisualAmount(safeTokenItem.balance, safeTokenItem.tokenInfo.decimals, 0)
    : '0'

  const url = {
    pathname: AppRoutes.apps.open,
    query: { safe: query?.get('safe'), appUrl: SAFENET_STAKING_APP_URL },
  }

  return (
    <Box className={css.container}>
      <Tooltip title="Go to Safenet Staking">
        <span>
          <Link href={url} passHref legacyBehavior>
            <ButtonBase aria-label="Safenet Staking" className={css.tokenButton}>
              <SafeTokenIcon width={24} height={24} />
              <Typography component="div" variant="body2" lineHeight={1}>
                {loading ? <Skeleton width="16px" animation="wave" /> : safeBalance}
              </Typography>
            </ButtonBase>
          </Link>
        </span>
      </Tooltip>
    </Box>
  )
}

export default SafenetStakingWidget
