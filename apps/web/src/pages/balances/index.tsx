import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsTable from '@/components/balances/AssetsTable'
import AssetsHeader from '@/components/balances/AssetsHeader'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useState } from 'react'

import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'
import CurrencySelect from '@/components/balances/CurrencySelect'
import ManageTokensButton from '@/components/balances/ManageTokensButton'
import StakingBanner from '@/components/dashboard/StakingBanner'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'
import NoFeeCampaignBanner from '@/features/no-fee-campaign/components/NoFeeCampaignBanner'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { Box } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import useIsNoFeeCampaignEnabled from '@/features/no-fee-campaign/hooks/useIsNoFeeCampaignEnabled'
const Balances: NextPage = () => {
  const { balances, error } = useVisibleBalances()
  const [showHiddenAssets, setShowHiddenAssets] = useState(false)
  const toggleShowHiddenAssets = () => setShowHiddenAssets((prev) => !prev)
  const isStakingBannerVisible = useIsStakingBannerVisible()
  const isNoFeeCampaignEnabled = useIsNoFeeCampaignEnabled()
  const [hideNoFeeCampaignBanner, setHideNoFeeCampaignBanner] = useLocalStorage<boolean>(
    'hideNoFeeCampaignAssetsPageBanner',
  )

  const tokensFiatTotal = balances.tokensFiatTotal ? Number(balances.tokensFiatTotal) : undefined

  const handleNoFeeCampaignDismiss = () => {
    setHideNoFeeCampaignBanner(true)
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader>
        <ManageTokensButton onHideTokens={toggleShowHiddenAssets} />
        <CurrencySelect />
      </AssetsHeader>

      <main>
        {isStakingBannerVisible && (
          <Box mb={2} sx={{ ':empty': { display: 'none' } }}>
            <StakingBanner />
          </Box>
        )}

        {error ? (
          <PagePlaceholder img={<NoAssetsIcon />} text="There was an error loading your assets" />
        ) : (
          <>
            {isNoFeeCampaignEnabled && !hideNoFeeCampaignBanner && (
              <Box mb={2}>
                <NoFeeCampaignBanner onDismiss={handleNoFeeCampaignDismiss} />
              </Box>
            )}

            <Box mb={2}>
              <TotalAssetValue fiatTotal={tokensFiatTotal} />
            </Box>

            <AssetsTable setShowHiddenAssets={setShowHiddenAssets} showHiddenAssets={showHiddenAssets} />
          </>
        )}
      </main>
    </>
  )
}

export default Balances
