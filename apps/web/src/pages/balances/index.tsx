import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'

import AssetsTable from '@/components/balances/AssetsTable'
import AssetsHeader from '@/components/balances/AssetsHeader'
import usePortfolio from '@/hooks/usePortfolio'
import { useState } from 'react'

import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'
import AssetsSettingsButton from '@/components/balances/AssetsSettingsButton'
import CurrencySelect from '@/components/balances/CurrencySelect'
import StakingBanner from '@/components/dashboard/StakingBanner'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'
import { Box, Card } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import TotalAssetValue from '@/components/balances/TotalAssetValue'

const PortfolioChart = dynamic(() => import('@/features/charts/components/PortfolioChart'))

const Balances: NextPage = () => {
  const portfolio = usePortfolio()
  const [showHiddenAssets, setShowHiddenAssets] = useState(false)
  const toggleShowHiddenAssets = () => setShowHiddenAssets((prev) => !prev)
  const isStakingBannerVisible = useIsStakingBannerVisible()

  // Choose total to display based on showHiddenAssets flag
  const displayedTotal = showHiddenAssets ? portfolio.totalTokenBalance : portfolio.visibleTotalTokenBalance

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader>
        <AssetsSettingsButton showHiddenAssets={showHiddenAssets} toggleShowHiddenAssets={toggleShowHiddenAssets} />
        <CurrencySelect />
      </AssetsHeader>

      <main>
        {isStakingBannerVisible && (
          <Box mb={2} sx={{ ':empty': { display: 'none' } }}>
            <StakingBanner />
          </Box>
        )}

        {portfolio.error ? (
          <PagePlaceholder img={<NoAssetsIcon />} text="There was an error loading your assets" />
        ) : (
          <>
            <Box mb={2}>
              <TotalAssetValue fiatTotal={displayedTotal} />
            </Box>
            <Card sx={{ border: 0, p: 2, mb: 3 }}>
              <PortfolioChart />
            </Card>
            <AssetsTable setShowHiddenAssets={setShowHiddenAssets} showHiddenAssets={showHiddenAssets} />
          </>
        )}
      </main>
    </>
  )
}

export default Balances
