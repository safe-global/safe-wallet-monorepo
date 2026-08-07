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
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { Box, Stack } from '@mui/material'
import { useAppSelector } from '@/store'
import { selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { BRAND_NAME } from '@/config/constants'
import { NoFeeCampaignFeature, useIsNoFeeCampaignEnabled } from '@/features/no-fee-campaign'
import { PortfolioFeature } from '@/features/portfolio'
import { StakeFeature, useIsStakingPromoBannerVisible, STAKING_PROMO_BANNER_HIDE_KEY } from '@/features/stake'
import { useLoadFeature } from '@/features/__core__'
import TotalAssetValue from '@/components/balances/TotalAssetValue'

const Balances: NextPage = () => {
  const { NoFeeCampaignBanner } = useLoadFeature(NoFeeCampaignFeature)
  const { StakingPromoBanner } = useLoadFeature(StakeFeature)
  const { balances, error } = useVisibleBalances()
  const [showHiddenAssets, setShowHiddenAssets] = useState(false)
  const toggleShowHiddenAssets = () => setShowHiddenAssets((prev) => !prev)
  const manageTokensButtonRef = useRef<ManageTokensButtonHandle>(null)
  const isNoFeeCampaignEnabled = useIsNoFeeCampaignEnabled()
  const [hideNoFeeCampaignBanner, setHideNoFeeCampaignBanner] = useLocalStorage<boolean>(
    'hideNoFeeCampaignAssetsPageBanner',
  )
  const isStakingPromoBannerVisible = useIsStakingPromoBannerVisible()
  const [, setHideStakingPromoBanner] = useLocalStorage<boolean>(STAKING_PROMO_BANNER_HIDE_KEY)
  const portfolio = useLoadFeature(PortfolioFeature)
  const settings = useAppSelector(selectSettings)
  const showAllTokens = settings.tokenList === TOKEN_LISTS.ALL || settings.tokenList === undefined

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
        {isStakingPromoBannerVisible && (
          <Box mb={2} sx={{ ':empty': { display: 'none' } }}>
            <StakingPromoBanner onDismiss={() => setHideStakingPromoBanner(true)} />
          </Box>
        )}

        {!error && isNoFeeCampaignEnabled && !hideNoFeeCampaignBanner && (
          <Box mb={2}>
            <NoFeeCampaignBanner onDismiss={handleNoFeeCampaignDismiss} />
          </Box>
        )}

        <Box mb={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <TotalAssetValue
              fiatTotal={tokensFiatTotal}
              title="Total assets value"
              tooltipTitle={showAllTokens ? 'Total Balance may be different when you show all tokens.' : undefined}
              tooltipColor="warning"
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

        {error ? (
          <PagePlaceholder img={<NoAssetsIcon />} text="There was an error loading your assets" />
        ) : (
          <>
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
