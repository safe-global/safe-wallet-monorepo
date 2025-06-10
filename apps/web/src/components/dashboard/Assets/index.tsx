import { useMemo } from 'react'
import { Box, Skeleton, Typography, Paper, Card, Stack } from '@mui/material'
import useBalances from '@/hooks/useBalances'
import TokenAmount from '@/components/common/TokenAmount'
import SwapButton from '@/features/swap/components/SwapButton'
import { AppRoutes } from '@/config/routes'
import { ViewAllLink } from '../styled'
import css from '../PendingTxs/styles.module.css'
import { useRouter } from 'next/router'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { useVisibleAssets } from '@/components/balances/AssetsTable/useHideAssets'
import BuyCryptoButton from '@/components/common/BuyCryptoButton'
import SendButton from '@/components/balances/AssetsTable/SendButton'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
import { FiatBalance } from '@/components/balances/AssetsTable/FiatBalance'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import { isEligibleEarnToken } from '@/features/earn/utils'
import EarnButton from '@/features/earn/components/EarnButton'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import useIsEarnFeatureEnabled from '@/features/earn/hooks/useIsEarnFeatureEnabled'
import useChainId from '@/hooks/useChainId'
import TokenIcon from '@/components/common/TokenIcon'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import StakeButton from '@/features/stake/components/StakeButton'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import useIsStakingFeatureEnabled from '@/features/stake/hooks/useIsStakingFeatureEnabled'
import { formatPercentage } from '@safe-global/utils/utils/formatters'

const MAX_ASSETS = 5

const AssetsDummy = () => (
  <Box className={css.container}>
    <Skeleton variant="circular" width={26} height={26} />
    {Array.from({ length: 2 }).map((_, index) => (
      <Skeleton variant="text" sx={{ flex: 1 }} key={index} />
    ))}
    <Skeleton variant="text" width={88} />
  </Box>
)

const NoAssets = () => (
  <Paper elevation={0} sx={{ p: 5 }}>
    <Typography variant="h3" fontWeight="bold" mb={1}>
      Add funds to get started
    </Typography>

    <Typography>
      Add funds directly from your bank account or copy your address to send tokens from a different account.
    </Typography>

    <Box display="flex" mt={2}>
      <BuyCryptoButton />
    </Box>
  </Paper>
)

const AssetRow = ({
  fiatTotal,
  item,
  chainId,
  showSwap,
  showEarn,
  showStake,
}: {
  fiatTotal: string
  item: Balances['items'][number]
  chainId: string
  showSwap?: boolean
  showEarn?: boolean
  showStake?: boolean
}) => {
  const fiatTotalNumber = Number(fiatTotal)
  const percentageOfTotal = Number(item.fiatBalance) / fiatTotalNumber
  const percentage = formatPercentage(percentageOfTotal)

  return (
    <Box className={css.container} key={item.tokenInfo.address}>
      <Stack direction="row" gap={1.5} alignItems="center">
        <TokenIcon tokenSymbol={item.tokenInfo.symbol} logoUri={item.tokenInfo.logoUri ?? undefined} size={32} />
        <Box>
          <Typography>{item.tokenInfo.name}</Typography>
          <Typography variant="body2" className={css.tokenAmount}>
            <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} tokenSymbol={item.tokenInfo.symbol} />
          </Typography>
        </Box>
      </Stack>

      <Stack display={['none', 'flex']} direction="row" alignItems="center" gap={1}>
        <Box className={css.bar}>
          <Typography className={css.barPercentage} component="span" width={`${percentageOfTotal * 100}%`} />
        </Box>
        <Typography variant="body2">{percentage}</Typography>
      </Stack>

      <Box flex={1} display="block" textAlign="right">
        <FiatBalance balanceItem={item} />
        <FiatChange balanceItem={item} inline />
      </Box>

      <Box className={css.assetButtons}>
        {showSwap ? (
          <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.dashboard_assets} light />
        ) : (
          <SendButton tokenInfo={item.tokenInfo} light />
        )}

        {showEarn && isEligibleEarnToken(chainId, item.tokenInfo.address) && (
          <EarnButton tokenInfo={item.tokenInfo} trackingLabel={EARN_LABELS.dashboard_asset} compact={false} />
        )}

        {showStake && item.tokenInfo.type === TokenType.NATIVE_TOKEN && (
          <StakeButton tokenInfo={item.tokenInfo} trackingLabel={STAKE_LABELS.asset} compact={false} />
        )}
      </Box>
    </Box>
  )
}

const AssetList = ({ items, fiatTotal }: { items: Balances['items']; fiatTotal: string }) => {
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isEarnFeatureEnabled = useIsEarnFeatureEnabled()
  const isStakingFeatureEnabled = useIsStakingFeatureEnabled()
  const chainId = useChainId()

  return (
    <Box display="flex" flexDirection="column">
      {items.map((item) => (
        <AssetRow
          fiatTotal={fiatTotal}
          item={item}
          key={item.tokenInfo.address}
          chainId={chainId}
          showSwap={isSwapFeatureEnabled}
          showEarn={isEarnFeatureEnabled}
          showStake={isStakingFeatureEnabled}
        />
      ))}
    </Box>
  )
}

const isNonZeroBalance = (item: Balances['items'][number]) => item.balance !== '0'

const AssetsWidget = () => {
  const router = useRouter()
  const { safe } = router.query
  const { loading, balances } = useBalances()
  const visibleAssets = useVisibleAssets()

  const items = useMemo(() => {
    return visibleAssets.filter(isNonZeroBalance).slice(0, MAX_ASSETS)
  }, [visibleAssets])

  const viewAllUrl = useMemo(
    () => ({
      pathname: AppRoutes.balances.index,
      query: { safe },
    }),
    [safe],
  )

  return (
    <Card data-testid="assets-widget" sx={{ px: 1.5, py: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, mb: 1 }}>
        <Typography fontWeight={700}>Top assets</Typography>

        {items.length > 0 && <ViewAllLink url={viewAllUrl} text={`View all (${visibleAssets.length})`} />}
      </Stack>

      <Box>
        {loading ? (
          <AssetsDummy />
        ) : items.length > 0 ? (
          <AssetList items={items} fiatTotal={balances.fiatTotal} />
        ) : (
          <NoAssets />
        )}
      </Box>
    </Card>
  )
}

export default AssetsWidget
