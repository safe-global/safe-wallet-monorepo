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
import NoFeeNovemberBanner from '@/features/no-fee-november/components/NoFeeNovemberBanner'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { Box } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import useIsNoFeeNovemberFeatureEnabled from '@/features/no-fee-november/hooks/useIsNoFeeNovemberFeatureEnabled'
import PortfolioRefreshHint from '@/features/portfolio/components/PortfolioRefreshHint'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
const Balances: NextPage = () => {
  const { balances, error } = useVisibleBalances()
  const [showHiddenAssets, setShowHiddenAssets] = useState(false)
  const toggleShowHiddenAssets = () => setShowHiddenAssets((prev) => !prev)
  const manageTokensButtonRef = useRef<ManageTokensButtonHandle>(null)
  const isStakingBannerVisible = useIsStakingBannerVisible()
  const isNoFeeNovemberEnabled = useIsNoFeeNovemberFeatureEnabled()
  const isPortfolioEndpointEnabled = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false
  const [hideNoFeeNovemberBanner, setHideNoFeeNovemberBanner] = useLocalStorage<boolean>(
    'hideNoFeeNovemberAssetsPageBanner',
  )

  const tokensFiatTotal = balances.tokensFiatTotal ? Number(balances.tokensFiatTotal) : undefined

  const handleNoFeeNovemberDismiss = () => {
    setHideNoFeeNovemberBanner(true)
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Assets`}</title>
      </Head>

      <AssetsHeader>
        <ManageTokensButton ref={manageTokensButtonRef} onHideTokens={toggleShowHiddenAssets} />
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
            {isNoFeeNovemberEnabled && !hideNoFeeNovemberBanner && (
              <Box mb={2}>
                <NoFeeNovemberBanner onDismiss={handleNoFeeNovemberDismiss} />
              </Box>
            )}

            <Box mb={2}>
              <TotalAssetValue
                fiatTotal={tokensFiatTotal}
                isAllTokensMode={balances.isAllTokensMode}
                action={isPortfolioEndpointEnabled ? <PortfolioRefreshHint entryPoint="Assets" /> : undefined}
              />
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
