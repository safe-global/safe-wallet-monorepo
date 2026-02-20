import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsTable from '@/components/balances/AssetsTable'
import AssetsHeader from '@/components/balances/AssetsHeader'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useState, useRef } from 'react'
import type { ManageTokensButtonHandle } from '@/components/balances/ManageTokensButton'

import PagePlaceholder from '@/components/common/PagePlaceholder'
import NoAssetsIcon from '@/public/images/balances/no-assets.svg'
import CurrencySelect from '@/components/balances/CurrencySelect'
import ManageTokensButton from '@/components/balances/ManageTokensButton'
import StakingBanner from '@/components/dashboard/StakingBanner'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { Box, Stack } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import { NoFeeCampaignFeature, useIsNoFeeCampaignEnabled } from '@/features/no-fee-campaign'
import { PortfolioFeature } from '@/features/portfolio'
import { useLoadFeature } from '@/features/__core__'
import TotalAssetValue from '@/components/balances/TotalAssetValue'

const Balances: NextPage = () => {
  const { NoFeeCampaignBanner } = useLoadFeature(NoFeeCampaignFeature)
  const { balances, error } = useVisibleBalances()
  const [showHiddenAssets, setShowHiddenAssets] = useState(false)
  const toggleShowHiddenAssets = () => setShowHiddenAssets((prev) => !prev)
  const manageTokensButtonRef = useRef<ManageTokensButtonHandle>(null)
  const isStakingBannerVisible = useIsStakingBannerVisible()
  const isNoFeeCampaignEnabled = useIsNoFeeCampaignEnabled()
  const [hideNoFeeCampaignBanner, setHideNoFeeCampaignBanner] = useLocalStorage<boolean>(
    'hideNoFeeCampaignAssetsPageBanner',
  )
  const portfolio = useLoadFeature(PortfolioFeature)

  const tokensFiatTotal = balances.tokensFiatTotal ? Number(balances.tokensFiatTotal) : undefined

  const handleNoFeeCampaignDismiss = () => {
    setHideNoFeeCampaignBanner(true)
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader />

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
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <TotalAssetValue
                  fiatTotal={tokensFiatTotal}
                  title="Total assets value"
                  tooltipTitle="Total from this list only. Portfolio total includes positions and may use other token data."
                />

                <Stack direction="column" alignItems="flex-end" gap={0.5}>
                  <portfolio.PortfolioRefreshHint entryPoint="Assets" />
                  <Stack direction="row" gap={1} alignItems="center">
                    <ManageTokensButton ref={manageTokensButtonRef} onHideTokens={toggleShowHiddenAssets} />
                    <CurrencySelect />
                  </Stack>
                </Stack>
              </Stack>
            </Box>

            <AssetsTable
              setShowHiddenAssets={setShowHiddenAssets}
              showHiddenAssets={showHiddenAssets}
              onOpenManageTokens={() => manageTokensButtonRef.current?.openMenu()}
            />
          </>
        )}
      </main>
    </>
  )
}

export default Balances
