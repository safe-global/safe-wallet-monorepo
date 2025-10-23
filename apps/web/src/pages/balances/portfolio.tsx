import type { NextPage } from 'next'
import Head from 'next/head'
import { Box } from '@mui/material'

import AssetsHeader from '@/components/balances/AssetsHeader'
import AssetsSettingsButton from '@/components/balances/AssetsSettingsButton'
import CurrencySelect from '@/components/balances/CurrencySelect'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import MultichainPortfolioTable from '@/components/balances/MultichainPortfolioTable'
import usePortfolio from '@/hooks/usePortfolio'
import { BRAND_NAME } from '@/config/constants'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'

const Portfolio: NextPage = () => {
  const portfolio = usePortfolio()

  // Use the all-chains total for the portfolio view
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
            <MultichainPortfolioTable />
          </>
        )}
      </main>
    </>
  )
}

export default Portfolio
