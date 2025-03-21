import FirstSteps from '@/components/dashboard/FirstSteps'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ReactElement } from 'react'
import dynamic from 'next/dynamic'
import { Grid } from '@mui/material'
import PendingTxsList from '@/components/dashboard/PendingTxs/PendingTxsList'
import AssetsWidget from '@/components/dashboard/Assets'
import Overview from '@/components/dashboard/Overview/Overview'
import SafeAppsDashboardSection from '@/components/dashboard/SafeAppsDashboardSection/SafeAppsDashboardSection'
import GovernanceSection from '@/components/dashboard/GovernanceSection/GovernanceSection'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import StakingBanner from '@/components/dashboard/StakingBanner'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import css from './styles.module.css'
import { InconsistentSignerSetupWarning } from '@/features/multichain/components/SignerSetupWarning/InconsistentSignerSetupWarning'
import useIsStakingBannerEnabled from '@/features/stake/hooks/useIsStakingBannerEnabled'
import { UnsupportedMastercopyWarning } from '@/features/multichain/components/UnsupportedMastercopyWarning/UnsupportedMasterCopyWarning'

const RecoveryHeader = dynamic(() => import('@/features/recovery/components/RecoveryHeader'))

const Dashboard = (): ReactElement => {
  const { safe } = useSafeInfo()
  const showSafeApps = useHasFeature(FEATURES.SAFE_APPS)
  const isStakingBannerEnabled = useIsStakingBannerEnabled()
  const supportsRecovery = useIsRecoverySupported()

  return (
    <>
      <Grid container spacing={3}>
        {supportsRecovery && <RecoveryHeader />}

        <Grid item xs={12} className={css.hideIfEmpty}>
          <InconsistentSignerSetupWarning />
        </Grid>

        <Grid item xs={12} className={css.hideIfEmpty}>
          <UnsupportedMastercopyWarning />
        </Grid>

        <Grid item xs={12}>
          <Overview />
        </Grid>

        <Grid item xs={12} className={css.hideIfEmpty}>
          <FirstSteps />
        </Grid>

        {safe.deployed && (
          <>
            {isStakingBannerEnabled && (
              <Grid item xs={12} className={css.hideIfEmpty}>
                <StakingBanner hideLocalStorageKey="hideStakingBannerDashboard" large />
              </Grid>
            )}

            <Grid item xs={12} />

            <Grid item xs={12} lg={6}>
              <AssetsWidget />
            </Grid>

            <Grid item xs={12} lg={6}>
              <PendingTxsList />
            </Grid>

            {showSafeApps && (
              <Grid item xs={12}>
                <SafeAppsDashboardSection />
              </Grid>
            )}

            <Grid item xs={12} className={css.hideIfEmpty}>
              <GovernanceSection />
            </Grid>
          </>
        )}
      </Grid>
    </>
  )
}

export default Dashboard
