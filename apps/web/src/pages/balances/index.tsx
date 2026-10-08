import type { NextPage } from 'next'
import Head from 'next/head'

import AssetsTable from '@/components/balances/AssetsTable'
import AssetsHeader from '@/components/balances/AssetsHeader'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useState, useRef } from 'react'
import type { ManageTokensButtonHandle } from '@/components/balances/ManageTokensButton'

import CurrencySelect from '@/components/balances/CurrencySelect'
import ManageTokensButton from '@/components/balances/ManageTokensButton'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { BRAND_NAME } from '@/config/constants'
import { NoFeeCampaignFeature, useIsNoFeeCampaignEnabled } from '@/features/no-fee-campaign'
import { PortfolioFeature } from '@/features/portfolio'
import { StakeFeature, useIsStakingPromoBannerVisible, STAKING_PROMO_BANNER_HIDE_KEY } from '@/features/stake'
import { useLoadFeature } from '@/features/__core__'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import { BalancesView } from '@views/pages/balances/BalancesView'

const PORTFOLIO_ENTRY_POINT = 'Assets'

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
  const { PortfolioRefreshHint } = useLoadFeature(PortfolioFeature)

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

      <BalancesView
        showStakingPromoBanner={isStakingPromoBannerVisible}
        stakingPromoBanner={<StakingPromoBanner onDismiss={() => setHideStakingPromoBanner(true)} />}
        showNoFeeCampaignBanner={!error && isNoFeeCampaignEnabled && !hideNoFeeCampaignBanner}
        noFeeCampaignBanner={<NoFeeCampaignBanner onDismiss={handleNoFeeCampaignDismiss} />}
        renderTotalAssetValue={({ title, tooltipTitle }) => (
          <TotalAssetValue fiatTotal={tokensFiatTotal} title={title} tooltipTitle={tooltipTitle} />
        )}
        portfolioRefreshHint={<PortfolioRefreshHint entryPoint={PORTFOLIO_ENTRY_POINT} />}
        manageTokensButton={<ManageTokensButton ref={manageTokensButtonRef} onHideTokens={toggleShowHiddenAssets} />}
        currencySelect={<CurrencySelect />}
        hasError={!!error}
        assetsTable={
          <AssetsTable
            setShowHiddenAssets={setShowHiddenAssets}
            showHiddenAssets={showHiddenAssets}
            onOpenManageTokens={() => manageTokensButtonRef.current?.openMenu()}
          />
        }
      />
    </>
  )
}

export default Balances
