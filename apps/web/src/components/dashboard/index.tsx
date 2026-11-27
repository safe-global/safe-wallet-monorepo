import GnosisPayBanner from '@/features/gnosispay/public/components/GnosisPayBanner'
import FirstSteps from '@/components/dashboard/FirstSteps'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ReactElement } from 'react'
import PendingTxsList from '@/components/dashboard/PendingTxs/PendingTxsList'
import AssetsWidget from '@/components/dashboard/Assets'
import Overview from '@/components/dashboard/Overview/Overview'
import ExplorePossibleWidget from '@/components/dashboard/ExplorePossibleWidget'
import RecoveryHeader from '@/features/recovery/public/components/RecoveryHeader'
import { useHasFeature } from '@/hooks/useChains'
import css from './styles.module.css'
import InconsistentSignerSetupWarning from '@/features/multichain/public/components/InconsistentSignerSetupWarning'
import MastercopyWarning from '@/features/multichain/public/components/MastercopyWarning'
import { ActionRequiredPanel } from '@/components/dashboard/ActionRequiredPanel/ActionRequiredPanel'
import { VulnerableModuleWarning } from './ActionRequiredPanel/VulnerableModuleWarning'
import { useVulnerableSafe } from '@/features/security/public/hooks/useVulnerableModules'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useSafeTotalBalance from '@/hooks/useSafeTotalBalance'
import AddFundsToGetStarted from '@/components/dashboard/AddFundsBanner'
import useIsPositionsFeatureEnabled from '@/features/positions/public/hooks/useIsPositionsFeatureEnabled'
import { useBannerVisibility } from '@/features/hypernative/public/hooks/useBannerVisibility'
import { BannerType } from '@/features/hypernative/public/hooks/useBannerStorage'
import { HnBannerForCarousel } from '@/features/hypernative/public/components/HnBannerForCarousel'
import useIsStakingPromoBannerVisible, {
  STAKING_PROMO_BANNER_HIDE_KEY,
} from '@/features/stake/public/hooks/useIsStakingPromoBannerVisible'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import HnPendingBanner from '@/features/hypernative/public/components/HnPendingBanner'
import StakingPromoBanner from '@/features/stake/public/components/StakingPromoBanner'
import NonPinnedWarning from '@/features/myAccounts/public/components/NonPinnedWarning'
import PositionsWidget from '@/features/positions/public/components/PositionsWidget'

const Dashboard = (): ReactElement => {
  const { safe } = useSafeInfo()
  const showSafeApps = useHasFeature(FEATURES.SAFE_APPS)
  const isVulnerableSafe = useVulnerableSafe()

  const { noAssets } = useSafeTotalBalance()

  const isPositionsFeatureEnabled = useIsPositionsFeatureEnabled()
  const { showBanner: showHnBanner } = useBannerVisibility(BannerType.Promo)
  const isStakingPromoBannerVisible = useIsStakingPromoBannerVisible()
  const [, setHideStakingPromoBanner] = useLocalStorage<boolean>(STAKING_PROMO_BANNER_HIDE_KEY)

  return (
    <>
      <div className={css.dashboardGrid}>
        <div className={css.leftCol}>
          <GnosisPayBanner />
          <Overview />

          {isStakingPromoBannerVisible && <StakingPromoBanner onDismiss={() => setHideStakingPromoBanner(true)} />}

          {noAssets && (
            <div className="flex flex-col gap-2">
              {showHnBanner && <HnBannerForCarousel onDismiss={() => {}} />}
              {!showHnBanner && <AddFundsToGetStarted />}
            </div>
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
            </>
          )}
        </div>

        <div className={css.rightCol}>
          <ActionRequiredPanel defaultExpanded={isVulnerableSafe}>
            <VulnerableModuleWarning isVulnerable={isVulnerableSafe} />
            <RecoveryHeader />
            <InconsistentSignerSetupWarning />
            <MastercopyWarning />
            <NonPinnedWarning />
          </ActionRequiredPanel>

          {safe.deployed && <PendingTxsList />}

          <HnPendingBanner />
        </div>
      </div>
    </>
  )
}

export default Dashboard
