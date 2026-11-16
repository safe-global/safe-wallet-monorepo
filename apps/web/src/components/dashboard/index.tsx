import FirstSteps from '@/components/dashboard/FirstSteps'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ReactElement, useMemo } from 'react'
import dynamic from '@/utils/dynamic'
import PendingTxsList from '@/components/dashboard/PendingTxs/PendingTxsList'
import AssetsWidget from '@/components/dashboard/Assets'
import Overview from '@/components/dashboard/Overview/Overview'
import ExplorePossibleWidget from '@/components/dashboard/ExplorePossibleWidget'
import RecoveryHeader from '@/features/recovery/public/RecoveryHeader'
import { useHasFeature } from '@/hooks/useChains'
import css from './styles.module.css'
import InconsistentSignerSetupWarning from '@/features/multichain/public/InconsistentSignerSetupWarning'
import MastercopyWarning from '@/features/multichain/public/MastercopyWarning'
import { MyAccountsFeature } from '@/features/myAccounts'
import { ActionRequiredPanel } from '@/components/dashboard/ActionRequiredPanel/ActionRequiredPanel'
import { VulnerableModuleWarning } from './ActionRequiredPanel/VulnerableModuleWarning'
import { useVulnerableSafe } from '@/features/security/public/useVulnerableModules'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import AddFundsToGetStarted from '@/components/dashboard/AddFundsBanner'
import useIsPositionsFeatureEnabled from '@/features/positions/public/useIsPositionsFeatureEnabled'
import { useBannerVisibility } from '@/features/hypernative/public/useBannerVisibility'
import { BannerType } from '@/features/hypernative/public/useBannerStorage'
import { HnBannerForCarousel } from '@/features/hypernative/public/HnBannerForCarousel'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import useIsStakingPromoBannerVisible, {
  STAKING_PROMO_BANNER_HIDE_KEY,
} from '@/features/stake/public/useIsStakingPromoBannerVisible'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import HnPendingBanner from '@/features/hypernative/public/HnPendingBanner'
import StakingPromoBanner from '@/features/stake/public/StakingPromoBanner'

const PositionsWidget = dynamic(() => import('@/features/positions/public/PositionsWidget'))

const Dashboard = (): ReactElement => {
  const { safe } = useSafeInfo()
  const { NonPinnedWarning } = useLoadFeature(MyAccountsFeature)
  const showSafeApps = useHasFeature(FEATURES.SAFE_APPS)
  const isVulnerableSafe = useVulnerableSafe()

  const { balances, loaded: balancesLoaded } = useVisibleBalances()
  const items = useMemo(() => {
    return balances.items.filter((item) => item.balance !== '0')
  }, [balances.items])

  const isPositionsFeatureEnabled = useIsPositionsFeatureEnabled()
  const { showBanner: showHnBanner } = useBannerVisibility(BannerType.Promo)
  const isStakingPromoBannerVisible = useIsStakingPromoBannerVisible()
  const [, setHideStakingPromoBanner] = useLocalStorage<boolean>(STAKING_PROMO_BANNER_HIDE_KEY)

  const noAssets = balancesLoaded && items.length === 0

  return (
    <>
      <div className={css.dashboardGrid}>
        <div className={css.leftCol}>
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
