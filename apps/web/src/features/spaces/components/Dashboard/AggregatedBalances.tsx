import { useChain } from '@/hooks/useChains'
import { Card, Grid2, Skeleton, Stack, Typography } from '@mui/material'
import css from '@/features/spaces/components/Dashboard/styles.module.css'
import FiatValue from '@/components/common/FiatValue'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import type { SafeOverview } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import ChainIndicator from '@/components/common/ChainIndicator'

type FiatTotalByChain = {
  chainId: string
  total: number
  percentage: number
}

function aggregateFiatTotalsByChainId(items: SafeOverview[]): FiatTotalByChain[] {
  const totals: Record<string, number> = {}

  for (const item of items) {
    const fiatValue = Number(item.fiatTotal) || 0
    totals[item.chainId] = (totals[item.chainId] || 0) + fiatValue
  }

  const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0)

  const result = Object.entries(totals).map(([chainId, total]) => {
    const percentage = grandTotal ? (total / grandTotal) * 100 : 0

    return {
      chainId,
      total,
      percentage: parseFloat(percentage.toFixed(2)),
    }
  })

  result.sort((a, b) => b.total - a.total)

  return result
}

function getTopFiatTotals(chainTotals: FiatTotalByChain[]): FiatTotalByChain[] {
  const MAX_NETWORKS = 5
  if (chainTotals.length <= MAX_NETWORKS) {
    return chainTotals
  }

  const topTotals = chainTotals.slice(0, MAX_NETWORKS - 1)
  const rest = chainTotals.slice(MAX_NETWORKS - 1)

  const otherTotal = rest.reduce((sum, item) => sum + item.total, 0)
  const percentage = rest.reduce((sum, item) => sum + item.percentage, 0)

  const otherItem: FiatTotalByChain = {
    chainId: 'Other',
    total: otherTotal,
    percentage,
  }

  return [...topTotals, otherItem]
}

const AggregatedBalanceByChain = ({ fiatTotalByChain }: { fiatTotalByChain: FiatTotalByChain }) => {
  const chain = useChain(fiatTotalByChain.chainId)

  return (
    <Stack>
      <Typography component="div" variant="body2" color="primary.light" mb={0.5} height="24px">
        {fiatTotalByChain.chainId === 'Other' ? 'Other' : <ChainIndicator chainId={fiatTotalByChain.chainId} />}
      </Typography>

      <Typography variant="h3" fontWeight="700" mb={0.5}>
        <FiatValue value={fiatTotalByChain.total.toString()} maxLength={20} precise />
      </Typography>

      <div className={css.chainIndicator}>
        <Typography
          component="span"
          className={css.chainIndicatorColor}
          bgcolor={chain?.theme.backgroundColor || '#dddee0'}
          width={`${fiatTotalByChain.percentage}%`}
        />
      </div>
    </Stack>
  )
}

const AggregatedBalance = ({ safeItems }: { safeItems: SafeItem[] }) => {
  const currency = useAppSelector(selectCurrency)

  const { data: safeOverviews, isLoading } = useGetMultipleSafeOverviewsQuery({ safes: safeItems, currency })
  const aggregatedBalance = safeOverviews ? safeOverviews.reduce((prev, next) => prev + Number(next.fiatTotal), 0) : 0
  const fiatTotalByChainId = safeOverviews ? aggregateFiatTotalsByChainId(safeOverviews) : []
  const topTotals = getTopFiatTotals(fiatTotalByChainId)

  if (isLoading) return <AggregatedBalanceSkeleton />

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="body2" fontWeight="bold" mb={1} color="primary.light">
        Aggregated balance
      </Typography>
      <Typography
        component="div"
        variant="h1"
        sx={{
          fontSize: 44,
          lineHeight: '40px',
        }}
      >
        <FiatValue value={aggregatedBalance.toString()} maxLength={20} precise />
      </Typography>

      {topTotals && (
        <Grid2 container mt={3} spacing={2}>
          {topTotals.map((fiatTotal) => {
            return (
              <Grid2 key={fiatTotal.chainId} size={{ xs: 12, md: 'grow' }} maxWidth={{ xs: 1, md: '20%' }}>
                <AggregatedBalanceByChain fiatTotalByChain={fiatTotal} />
              </Grid2>
            )
          })}
        </Grid2>
      )}
    </Card>
  )
}

const AggregatedBalanceSkeleton = () => {
  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Skeleton variant="rounded" width={100} height={20} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" width={160} height={40} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" width={200} height={58} />
    </Card>
  )
}

export default AggregatedBalance
