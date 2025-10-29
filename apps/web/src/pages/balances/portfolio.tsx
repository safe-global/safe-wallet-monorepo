import type { NextPage } from 'next'
import Head from 'next/head'
import { Box, Card } from '@mui/material'
import dynamic from 'next/dynamic'

import AssetsHeader from '@/components/balances/AssetsHeader'
import AssetsSettingsButton from '@/components/balances/AssetsSettingsButton'
import CurrencySelect from '@/components/balances/CurrencySelect'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import MultichainPortfolioTable from '@/components/balances/MultichainPortfolioTable'
import PnLSummary from '@/components/balances/PnLSummary'
import usePortfolio from '@/hooks/usePortfolio'
import { BRAND_NAME } from '@/config/constants'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'

const PortfolioChart = dynamic(() => import('@/features/charts/components/PortfolioChart'))

const Portfolio: NextPage = () => {
  const portfolio = usePortfolio()

  const displayedTotal = portfolio.allChainsTotalBalance || portfolio.totalBalance

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Portfolio`}</title>
      </Head>

      <AssetsHeader>
        <AssetsSettingsButton />
        <CurrencySelect />
      </AssetsHeader>

      <main>
        {portfolio.error ? (
          <PagePlaceholder img={<NoAssetsIcon />} text="There was an error loading your portfolio" />
        ) : (
          <>
            <Box mb={2}>
              <TotalAssetValue fiatTotal={displayedTotal} title="Total portfolio value" />
            </Box>
            <Card sx={{ border: 0, p: 2, mb: 3 }}>
              <PortfolioChart />
            </Card>
            {portfolio.pnl && (
              <Box mb={3}>
                <PnLSummary pnl={portfolio.pnl} />
              </Box>
            )}
            <MultichainPortfolioTable />
          </>
        )}
      </main>
    </>
  )
}

export default Portfolio
