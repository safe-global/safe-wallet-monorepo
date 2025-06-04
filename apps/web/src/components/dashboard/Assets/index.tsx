import { useMemo } from 'react'
import { Box, Skeleton, Typography, Paper } from '@mui/material'
import useBalances from '@/hooks/useBalances'
import TokenAmount from '@/components/common/TokenAmount'
import SwapButton from '@/features/swap/components/SwapButton'
import { AppRoutes } from '@/config/routes'
import { WidgetContainer, WidgetBody, ViewAllLink } from '../styled'
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
  item,
  chainId,
  showSwap,
  showEarn,
}: {
  item: Balances['items'][number]
  chainId: string
  showSwap?: boolean
  showEarn?: boolean
}) => (
  <Box className={css.container} key={item.tokenInfo.address}>
    <Box flex={1}>
      <TokenAmount
        value={item.balance}
        decimals={item.tokenInfo.decimals}
        tokenSymbol={item.tokenInfo.symbol}
        logoUri={item.tokenInfo.logoUri}
      />
    </Box>

    {showEarn && isEligibleEarnToken(chainId, item.tokenInfo.address) && (
      <Box>
        <EarnButton tokenInfo={item.tokenInfo} trackingLabel={EARN_LABELS.dashboard_asset} />
      </Box>
    )}

    <Box flex={1} display={['none', 'block']} textAlign="right">
      <FiatBalance balanceItem={item} />
    </Box>

    <Box display={['none', 'block']} textAlign="right">
      <FiatChange balanceItem={item} />
    </Box>

    <Box my={-0.7}>
      {showSwap ? (
        <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.dashboard_assets} />
      ) : (
        <SendButton tokenInfo={item.tokenInfo} isOutlined />
      )}
    </Box>
  </Box>
)

const AssetList = ({ items }: { items: Balances['items'] }) => {
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isEarnFeatureEnabled = useIsEarnFeatureEnabled()
  const chainId = useChainId()

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {items.map((item) => (
        <AssetRow
          item={item}
          key={item.tokenInfo.address}
          chainId={chainId}
          showSwap={isSwapFeatureEnabled}
          showEarn={isEarnFeatureEnabled}
        />
      ))}
    </Box>
  )
}

const isNonZeroBalance = (item: Balances['items'][number]) => item.balance !== '0'

const AssetsWidget = () => {
  const router = useRouter()
  const { safe } = router.query
  const { loading } = useBalances()
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
    <WidgetContainer data-testid="assets-widget">
      <div className={css.title}>
        <Typography component="h2" variant="subtitle1" fontWeight={700} mb={2}>
          Top assets
        </Typography>

        {items.length > 0 && <ViewAllLink url={viewAllUrl} text={`View all (${visibleAssets.length})`} />}
      </div>

      <WidgetBody>
        {loading ? <AssetsDummy /> : items.length > 0 ? <AssetList items={items} /> : <NoAssets />}
      </WidgetBody>
    </WidgetContainer>
  )
}

export default AssetsWidget
