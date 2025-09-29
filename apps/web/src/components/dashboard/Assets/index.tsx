import { useMemo } from 'react'
import { Box, Skeleton, Typography, Paper, Card, Stack, Divider } from '@mui/material'
import useBalances from '@/hooks/useBalances'
import TokenAmount from '@/components/common/TokenAmount'
import SwapButton from '@/features/swap/components/SwapButton'
import { AppRoutes } from '@/config/routes'
import { ViewAllLink } from '../styled'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { useVisibleAssets } from '@/components/balances/AssetsTable/useHideAssets'
import SendButton from '@/components/balances/AssetsTable/SendButton'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
import { FiatBalance } from '@/components/balances/AssetsTable/FiatBalance'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import { isEligibleEarnToken } from '@/features/earn/utils'
import EarnButton from '@/features/earn/components/EarnButton'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import { useIsEarnPromoEnabled } from '@/features/earn/hooks/useIsEarnFeatureEnabled'
import useIsStakingPromoEnabled from '@/features/stake/hooks/useIsStakingBannerEnabled'
import useChainId from '@/hooks/useChainId'
import TokenIcon from '@/components/common/TokenIcon'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import StakeButton from '@/features/stake/components/StakeButton'
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
  <Card sx={{ px: 1.5, py: 2.5 }} component="section">
    <Stack direction="row" sx={{ px: 1.5, mb: 1 }}>
      <Typography fontWeight={700}>Top assets</Typography>
    </Stack>

    <Skeleton height={66} variant="rounded" />
  </Card>
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
  return (
    <Box className={css.container} key={item.tokenInfo.address}>
      <Stack direction="row" gap={1.5} alignItems="center">
        <TokenIcon tokenSymbol={item.tokenInfo.symbol} logoUri={item.tokenInfo.logoUri ?? undefined} size={32} />
        <Box>
          <Typography fontWeight="600">{item.tokenInfo.name}</Typography>
          <Typography variant="body2" className={css.tokenAmount}>
            <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} tokenSymbol={item.tokenInfo.symbol} />
          </Typography>
        </Box>
      </Stack>

      <Box flex={1} display="block" textAlign="right" height="44px">
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
    <Card data-testid="assets-widget" sx={{ border: 0, px: 1.5, pt: 2.5, pb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, mb: 1 }}>
        <Typography fontWeight={700}>Top assets</Typography>

        {items.length > 0 && <ViewAllLink url={viewAllUrl} text="View all" />}
      </Stack>

      <Box>{items.length > 0 ? <AssetList items={items} /> : <NoAssets />}</Box>
    </Card>
  )
}

export default AssetsWidget
