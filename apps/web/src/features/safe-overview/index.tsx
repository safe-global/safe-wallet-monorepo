import { type ReactElement } from 'react'
import dynamic from 'next/dynamic'
import { Grid } from '@mui/material'
import AccountHeader from './components/AccountHeader'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import css from './styles.module.css'
import { InconsistentSignerSetupWarning, UnsupportedMastercopyWarning } from '@/features/multichain'
import { MyAccountsFeature } from '@/features/myAccounts'
import { AssetsListFeature } from '@/features/assets-list'
import { PendingListFeature } from '@/features/pending-list'
import { useLoadFeature } from '@/features/__core__'

const RecoveryHeader = dynamic(() => import('@/features/recovery/components/RecoveryHeader'))

const SafeOverview = (): ReactElement => {
  const { NonPinnedWarning } = useLoadFeature(MyAccountsFeature)
  const { AssetsList } = useLoadFeature(AssetsListFeature)
  const { PendingList } = useLoadFeature(PendingListFeature)
  const supportsRecovery = useIsRecoverySupported()

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

        <Grid item xs={12} className={css.hideIfEmpty} sx={{ '& > div': { m: 0 } }}>
          <NonPinnedWarning />
        </Grid>
      </Grid>

      <AccountHeader />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AssetsList />
        <PendingList />
      </div>
    </>
  )
}

export default SafeOverview
