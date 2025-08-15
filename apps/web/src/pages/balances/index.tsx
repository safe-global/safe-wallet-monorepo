import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsTable from '@/components/balances/AssetsTable'
import AssetsHeader from '@/components/balances/AssetsHeader'
import useBalances from '@/hooks/useBalances'
import { useState } from 'react'

import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'
import HiddenTokenButton from '@/components/balances/HiddenTokenButton'
import CurrencySelect from '@/components/balances/CurrencySelect'
import TokenListSelect from '@/components/balances/TokenListSelect'
import StakingBanner from '@/components/dashboard/StakingBanner'
import useIsStakingBannerEnabled from '@/features/stake/hooks/useIsStakingBannerEnabled'
import { Box } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import Positions from '@/features/positions'
import TotalAssetValue from '@/components/balances/TotalAssetValue'

const Balances: NextPage = () => {
  const { error } = useBalances()
  const [showHiddenAssets, setShowHiddenAssets] = useState(false)
  const toggleShowHiddenAssets = () => setShowHiddenAssets((prev) => !prev)
  const isStakingBannerEnabled = useIsStakingBannerEnabled()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader>
        <HiddenTokenButton showHiddenAssets={showHiddenAssets} toggleShowHiddenAssets={toggleShowHiddenAssets} />
        <TokenListSelect />
        <CurrencySelect />
      </AssetsHeader>

      <main>
        {isStakingBannerEnabled && (
          <Box mb={2} sx={{ ':empty': { display: 'none' } }}>
            <StakingBanner />
          </Box>
        )}

        {error ? (
          <PagePlaceholder img={<NoAssetsIcon />} text="There was an error loading your assets" />
        ) : (
          <>
            <Box mb={2}>
              <TotalAssetValue />
            </Box>
            <AssetsTable setShowHiddenAssets={setShowHiddenAssets} showHiddenAssets={showHiddenAssets} />
            <Positions />
          </>
        )}
      </main>
    </>
  )
}

export default Balances
