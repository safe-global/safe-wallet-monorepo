import { useMemo } from 'react'
import { Box, Skeleton, Typography, Paper, Stack, Divider } from '@mui/material'
import useBalances from '@/hooks/useBalances'
import TokenAmount from '@/components/common/TokenAmount'
import SwapButton from '@/features/swap/components/SwapButton'
import { AppRoutes } from '@/config/routes'
import { WidgetCard } from '../styled'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { useVisibleAssets } from '@/components/balances/AssetsTable/useHideAssets'
import SendButton from '@/components/balances/AssetsTable/SendButton'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
import { FiatBalance } from '@/components/balances/AssetsTable/FiatBalance'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import { isEligibleEarnToken, useIsEarnPromoEnabled, EarnButton } from '@/features/earn'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import { useIsStakingBannerEnabled as useIsStakingPromoEnabled } from '@/features/stake'
import useChainId from '@/hooks/useChainId'
import TokenIcon from '@/components/common/TokenIcon'
import { TokenType } from '@safe-global/store/gateway/types'
import { StakeFeature } from '@/features/stake'
import { useLoadFeature } from '@/features/__core__'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import NoAssetsIcon from '@/public/images/common/no-assets.svg'

const MAX_ASSETS = 4

const NoAssets = () => (
  <Paper elevation={0} sx={{ p: 5, textAlign: 'center' }}>
    <NoAssetsIcon />

    <Typography mb={0.5} mt={3}>
      No assets yet
    </Typography>

    <Typography color="primary.light">Deposit from another wallet to get started.</Typography>
  </Paper>
)

const AssetsSkeleton = () => (
  <WidgetCard title="Top assets" testId="assets-widget">
    <Skeleton height={66} variant="rounded" />
  </WidgetCard>
)

const AssetRow = ({
  item,
  chainId,
  showSwap,
  showEarn,
  showStake,
}: {
  item: Balances['items'][number]
  chainId: string
  showSwap?: boolean
  showEarn?: boolean
  showStake?: boolean
}) => {
  const stake = useLoadFeature(StakeFeature)

  return (
    <Box className={css.container} key={item.tokenInfo.address}>
      <Stack direction="row" gap={1.5} alignItems="center">
        <TokenIcon tokenSymbol={item.tokenInfo.symbol} logoUri={item.tokenInfo.logoUri || undefined} size={32} />
        <Box>
          <Typography fontWeight="600">{item.tokenInfo.name}</Typography>
          <Typography variant="body2" className={css.tokenAmount}>
            <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} tokenSymbol={item.tokenInfo.symbol} />
          </Typography>
        </Box>
      </Stack>

      <Box className={css.valueContainer}>
        <Box className={css.valueContent}>
          <FiatBalance balanceItem={item} />
          <FiatChange balanceItem={item} inline />
        </Box>

        <Box className={css.assetButtons}>
          <SendButton tokenInfo={item.tokenInfo} onlyIcon />

          {showSwap && (
            <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.dashboard_assets} onlyIcon />
          )}

          {showEarn && isEligibleEarnToken(chainId, item.tokenInfo.address) && (
            <EarnButton tokenInfo={item.tokenInfo} trackingLabel={EARN_LABELS.dashboard_asset} onlyIcon />
          )}

          {showStake && item.tokenInfo.type === TokenType.NATIVE_TOKEN && (
            <stake.StakeButton tokenInfo={item.tokenInfo} trackingLabel={STAKE_LABELS.asset} onlyIcon />
          )}
        </Box>
      </Box>
    </Box>
  )
}

const AssetList = ({ items }: { items: Balances['items'] }) => {
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isEarnPromoEnabled = useIsEarnPromoEnabled()
  const isStakingPromoEnabled = useIsStakingPromoEnabled()
  const chainId = useChainId()

  return (
    <Box display="flex" flexDirection="column">
      {items.map((item, index) => (
        <Box key={item.tokenInfo.address}>
          {index > 0 && <Divider sx={{ opacity: 0.5, marginLeft: '56px' }} />}
          <AssetRow
            item={item}
            chainId={chainId}
            showSwap={isSwapFeatureEnabled}
            showEarn={isEarnPromoEnabled}
            showStake={isStakingPromoEnabled}
          />
        </Box>
      ))}
    </Box>
  )
}

export const isNonZeroBalance = (item: Balances['items'][number]) => item.balance !== '0'

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

  const isLoading = loading || !balances.fiatTotal

  if (isLoading) return <AssetsSkeleton />

  return (
    <WidgetCard title="Top assets" viewAllUrl={items.length > 0 ? viewAllUrl : undefined} testId="assets-widget">
      <Box>{items.length > 0 ? <AssetList items={items} /> : <NoAssets />}</Box>
    </WidgetCard>
  )
}

export default AssetsWidget
