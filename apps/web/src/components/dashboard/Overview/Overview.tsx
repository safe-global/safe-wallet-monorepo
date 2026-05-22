import { type ReactElement, useMemo } from 'react'
import { Card, Box, Stack } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import OverviewSkeleton from './OverviewSkeleton'
import { PortfolioFeature } from '@/features/portfolio'
import { ActionsTrayFeature } from '@/features/actions-tray'
import { useLoadFeature } from '@/features/__core__'

const Overview = (): ReactElement => {
  const { safe, safeLoading, safeLoaded } = useSafeInfo()
  const { balances, loaded: balancesLoaded, loading: balancesLoading } = useVisibleBalances()
  const portfolio = useLoadFeature(PortfolioFeature)
  const { ActionsTray } = useLoadFeature(ActionsTrayFeature)

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || isInitialState

  const items = useMemo(() => {
    return balances.items.filter((item) => item.balance !== '0')
  }, [balances.items])

  const noAssets = balancesLoaded && items.length === 0

  if (isLoading) return <OverviewSkeleton />

  return (
    <Card sx={{ border: 0, px: 3, pt: 2.5, borderRadius: '24px', pb: 1.5 }} component="section">
      {!portfolio.$isDisabled && (
        <Box display="flex" justifyContent="flex-end" mb={-3}>
          <portfolio.PortfolioRefreshHint entryPoint="Dashboard" />
        </Box>
      )}
      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'flex-end' }}
          justifyContent="space-between"
        >
          <TotalAssetValue fiatTotal={balances.fiatTotal} size="lg" title="Total balance" />

          {safe.deployed && <ActionsTray noAssets={noAssets} />}
        </Stack>
      </Box>
    </Card>
  )
}

export default Overview
