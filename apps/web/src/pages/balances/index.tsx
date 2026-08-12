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
          <div className="mb-4 empty:hidden">
            <StakingPromoBanner onDismiss={() => setHideStakingPromoBanner(true)} />
          </div>
        )}

        {!error && isNoFeeCampaignEnabled && !hideNoFeeCampaignBanner && (
          <div className="mb-4">
            <NoFeeCampaignBanner onDismiss={handleNoFeeCampaignDismiss} />
          </div>
        )}

        <div className="mb-4">
          <div className="flex flex-row items-center justify-between">
            <TotalAssetValue
              fiatTotal={tokensFiatTotal}
              title="Total assets value"
              tooltipTitle="Total from this list only. Portfolio total includes positions and may use other token data."
            />

            <div className="flex flex-col items-end gap-1">
              <portfolio.PortfolioRefreshHint entryPoint="Assets" />
              <div className="flex flex-row items-center gap-2">
                <ManageTokensButton ref={manageTokensButtonRef} onHideTokens={toggleShowHiddenAssets} />
                <CurrencySelect />
              </div>
            </div>
          </div>
        </div>

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
