import FirstSteps from '@/components/dashboard/FirstSteps'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ReactElement, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Grid } from '@mui/material'
import PendingTxsList from '@/components/dashboard/PendingTxs/PendingTxsList'
import AssetsWidget from '@/components/dashboard/Assets'
import Overview from '@/components/dashboard/Overview/Overview'
import SafeAppsDashboardSection from '@/components/dashboard/SafeAppsDashboardSection/SafeAppsDashboardSection'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import { useHasFeature } from '@/hooks/useChains'
import css from './styles.module.css'
import { InconsistentSignerSetupWarning } from '@/features/multichain/components/SignerSetupWarning/InconsistentSignerSetupWarning'
import { UnsupportedMastercopyWarning } from '@/features/multichain/components/UnsupportedMastercopyWarning/UnsupportedMasterCopyWarning'
import { FEATURES } from '@safe-global/utils/utils/chains'
import NewsDisclaimers from '@/components/dashboard/NewsCarousel/NewsDisclaimers'
import NewsCarousel, { type BannerItem } from '@/components/dashboard/NewsCarousel'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useIsEarnPromoEnabled } from '@/features/earn/hooks/useIsEarnFeatureEnabled'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'
import EarnBanner, { earnBannerID } from '@/components/dashboard/NewsCarousel/banners/EarnBanner'
import SpacesBanner, { spacesBannerID } from '@/components/dashboard/NewsCarousel/banners/SpacesBanner'
import StakeBanner, { stakeBannerID } from '@/components/dashboard/NewsCarousel/banners/StakeBanner'
import AddFundsToGetStarted from '@/components/dashboard/AddFundsBanner'
import useIsPositionsFeatureEnabled from '@/features/positions/hooks/useIsPositionsFeatureEnabled'

const RecoveryHeader = dynamic(() => import('@/features/recovery/components/RecoveryHeader'))
const PositionsWidget = dynamic(() => import('@/features/positions/components/PositionsWidget'))

const Dashboard = (): ReactElement => {
  const { safe } = useSafeInfo()
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

  const banners = [
    isEarnPromoEnabled && { id: earnBannerID, element: EarnBanner },
    isSpacesFeatureEnabled && { id: spacesBannerID, element: SpacesBanner },
    isStakingBannerVisible && { id: stakeBannerID, element: StakeBanner },
  ].filter(Boolean) as BannerItem[]

  const noAssets = balancesLoaded && items.length === 0

  return (
    <>
      <Grid container spacing={3} mb={3}>
        {supportsRecovery && <RecoveryHeader />}

        <Grid item xs={12} className={css.hideIfEmpty} sx={{ '& > div': { m: 0 } }}>
          <InconsistentSignerSetupWarning />
        </Grid>

        <Grid item xs={12} className={css.hideIfEmpty} sx={{ '& > div': { m: 0 } }}>
          <UnsupportedMastercopyWarning />
        </Grid>
      </Grid>

      <div className={css.dashboardGrid}>
        <div className={css.leftCol}>
          <Overview />

          {noAssets ? <AddFundsToGetStarted /> : <NewsCarousel banners={banners} />}

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

              {showSafeApps && <SafeAppsDashboardSection />}

              <NewsDisclaimers />
            </>
          )}
        </div>

        <div className={css.rightCol}>{safe.deployed && <PendingTxsList />}</div>
      </div>
    </>
  )
}

export default Dashboard
