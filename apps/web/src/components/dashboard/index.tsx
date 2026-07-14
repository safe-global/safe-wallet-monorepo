import FirstSteps from '@/components/dashboard/FirstSteps'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ReactElement, useMemo } from 'react'
import dynamic from 'next/dynamic'
import PendingTxsList from '@/components/dashboard/PendingTxs/PendingTxsList'
import AssetsWidget from '@/components/dashboard/Assets'
import Overview from '@/components/dashboard/Overview/Overview'
import ExplorePossibleWidget from '@/components/dashboard/ExplorePossibleWidget'
import { useIsRecoverySupported } from '@/features/recovery'
import { useHasFeature } from '@/hooks/useChains'
import css from './styles.module.css'
import {
  InconsistentSignerSetupWarning,
  OutdatedMastercopyWarning,
  UnsupportedMastercopyWarning,
} from '@/features/multichain'
import { MyAccountsFeature } from '@/features/myAccounts'
import { ActionRequiredPanel } from './ActionRequiredPanel'
import { VulnerableModuleWarning } from './ActionRequiredPanel/VulnerableModuleWarning'
import { useVulnerableSafe } from '@/features/security'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import AddFundsToGetStarted from '@/components/dashboard/AddFundsBanner'
import { useIsPositionsFeatureEnabled } from '@/features/positions'
import { useBannerVisibility, BannerType, HnBannerForCarousel, HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'
import { StakeFeature, useIsStakingPromoBannerVisible, STAKING_PROMO_BANNER_HIDE_KEY } from '@/features/stake'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

const RecoveryHeader = dynamic(() => import('@/features/recovery/components/RecoveryHeader'))
const PositionsWidget = dynamic(() => import('@/features/positions/components/PositionsWidget'))

const Dashboard = (): ReactElement => {
  const { safe } = useSafeInfo()
  const hn = useLoadFeature(HypernativeFeature)
  const { NonPinnedWarning } = useLoadFeature(MyAccountsFeature)
  const showSafeApps = useHasFeature(FEATURES.SAFE_APPS)
  const supportsRecovery = useIsRecoverySupported()
  const isVulnerableSafe = useVulnerableSafe()

  const { balances, loaded: balancesLoaded } = useVisibleBalances()
  const items = useMemo(() => {
    return balances.items.filter((item) => item.balance !== '0')
  }, [balances.items])

  const isPositionsFeatureEnabled = useIsPositionsFeatureEnabled()
  const { showBanner: showHnBanner } = useBannerVisibility(BannerType.Promo)
  const { StakingPromoBanner } = useLoadFeature(StakeFeature)
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
            {supportsRecovery && <RecoveryHeader />}
            <InconsistentSignerSetupWarning />
            <OutdatedMastercopyWarning />
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
