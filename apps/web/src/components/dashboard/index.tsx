import FirstSteps from '@/components/dashboard/FirstSteps'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ReactElement, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Stack } from '@mui/material'
import PendingTxsList from '@/components/dashboard/PendingTxs/PendingTxsList'
import AssetsWidget from '@/components/dashboard/Assets'
import Overview from '@/components/dashboard/Overview/Overview'
import ExplorePossibleWidget from '@/components/dashboard/ExplorePossibleWidget'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import { useHasFeature } from '@/hooks/useChains'
import css from './styles.module.css'
import { InconsistentSignerSetupWarning, UnsupportedMastercopyWarning } from '@/features/multichain'
import { MyAccountsFeature } from '@/features/myAccounts'
import { ActionRequiredPanel } from './ActionRequiredPanel'
import { FEATURES } from '@safe-global/utils/utils/chains'
import NewsDisclaimers from '@/components/dashboard/NewsCarousel/NewsDisclaimers'
import NewsCarousel, { type BannerItem } from '@/components/dashboard/NewsCarousel'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useIsEarnPromoEnabled } from '@/features/earn'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'
import { EarnBanner, earnBannerID } from '@/components/dashboard/NewsCarousel/banners/EarnBanner'
import { SpacesBanner, spacesBannerID } from '@/components/dashboard/NewsCarousel/banners/SpacesBanner'
import { StakeBanner, stakeBannerID } from '@/components/dashboard/NewsCarousel/banners/StakeBanner'
import AddFundsToGetStarted from '@/components/dashboard/AddFundsBanner'
import useIsPositionsFeatureEnabled from '@/features/positions/hooks/useIsPositionsFeatureEnabled'
import {
  NoFeeCampaignFeature,
  useNoFeeCampaignEligibility,
  useIsNoFeeCampaignEnabled,
} from '@/features/no-fee-campaign'
import {
  useBannerVisibility,
  BannerType,
  HnBannerForCarousel,
  hnBannerID,
  HypernativeFeature,
} from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'
import { EurcvBoostBanner, eurcvBoostBannerID } from '@/components/dashboard/NewsCarousel/banners/EurcvBoostBanner'

const RecoveryHeader = dynamic(() => import('@/features/recovery/components/RecoveryHeader'))
const PositionsWidget = dynamic(() => import('@/features/positions/components/PositionsWidget'))

const Dashboard = (): ReactElement => {
  const { safe } = useSafeInfo()
  const hn = useLoadFeature(HypernativeFeature)
  const { NoFeeCampaignBanner, noFeeCampaignBannerID } = useLoadFeature(NoFeeCampaignFeature)
  const { NonPinnedWarning } = useLoadFeature(MyAccountsFeature)
  const showSafeApps = useHasFeature(FEATURES.SAFE_APPS)
  const supportsRecovery = useIsRecoverySupported()

  const { balances, loaded: balancesLoaded } = useVisibleBalances()
  const items = useMemo(() => {
    return balances.items.filter((item) => item.balance !== '0')
  }, [balances.items])

  const isEarnPromoEnabled = useIsEarnPromoEnabled()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isStakingBannerVisible = useIsStakingBannerVisible()
  const isPositionsFeatureEnabled = useIsPositionsFeatureEnabled()
  const { isEligible } = useNoFeeCampaignEligibility()
  const isNoFeeCampaignEnabled = useIsNoFeeCampaignEnabled()
  const { showBanner: showHnBanner, loading: hnLoading } = useBannerVisibility(BannerType.Promo)
  const isEurcvBoostEnabled = useHasFeature(FEATURES.EURCV_BOOST)

  const banners = [
    showHnBanner && !hnLoading && { id: hnBannerID, element: HnBannerForCarousel },
    isEurcvBoostEnabled && { id: eurcvBoostBannerID, element: EurcvBoostBanner },
    isNoFeeCampaignEnabled && {
      id: noFeeCampaignBannerID,
      element: NoFeeCampaignBanner,
    },
    isEarnPromoEnabled && { id: earnBannerID, element: EarnBanner },
    isSpacesFeatureEnabled && {
      id: spacesBannerID,
      element: SpacesBanner,
      eligibilityState: isEligible === false,
    },
    isStakingBannerVisible && { id: stakeBannerID, element: StakeBanner },
  ].filter(Boolean) as BannerItem[]

  const noAssets = balancesLoaded && items.length === 0

  return (
    <>
      <div className={css.dashboardGrid}>
        <div className={css.leftCol}>
          <Overview />

          {noAssets ? (
            <Stack spacing={1}>
              {showHnBanner && <HnBannerForCarousel onDismiss={() => {}} />}
              {!showHnBanner && <AddFundsToGetStarted />}
            </Stack>
          ) : (
            <Stack minWidth="100%">
              <NewsCarousel banners={banners} />
            </Stack>
          )}

          <div className={css.hideIfEmpty}>
            <FirstSteps />
          </div>

          {safe.deployed && (
            <>
              <AssetsWidget />

              {isPositionsFeatureEnabled && (
                <div className={css.hideIfEmpty}>
                  <PositionsWidget />
                </div>
              )}

              {showSafeApps && <ExplorePossibleWidget />}

              <NewsDisclaimers />
            </>
          )}
        </div>

        <div className={css.rightCol}>
          <ActionRequiredPanel>
            {supportsRecovery && <RecoveryHeader />}
            <InconsistentSignerSetupWarning />
            <UnsupportedMastercopyWarning />
            <NonPinnedWarning />
          </ActionRequiredPanel>

          {safe.deployed && <PendingTxsList />}

          <hn.HnPendingBanner />
        </div>
      </div>
    </>
  )
}

export default Dashboard
