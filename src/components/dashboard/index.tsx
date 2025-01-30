import type { ReactElement } from 'react'
import dynamic from 'next/dynamic'
import { Grid } from '@mui/material'
import Overview from '@/components/dashboard/Overview/Overview'
import { FeaturedApps } from '@/components/dashboard/FeaturedApps/FeaturedApps'
import SafeAppsDashboardSection from '@/components/dashboard/SafeAppsDashboardSection/SafeAppsDashboardSection'
import GovernanceSection from '@/components/dashboard/GovernanceSection/GovernanceSection'
import CreationDialog from '@/components/dashboard/CreationDialog'
import { useRouter } from 'next/router'
import { CREATION_MODAL_QUERY_PARM } from '../new-safe/create/logic'

import useRecovery from '@/features/recovery/hooks/useRecovery'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
const RecoveryHeader = dynamic(() => import('@/features/recovery/components/RecoveryHeader'))
const RecoveryWidget = dynamic(() => import('@/features/recovery/components/RecoveryWidget'))

const Dashboard = (): ReactElement => {
  const router = useRouter()
  const { [CREATION_MODAL_QUERY_PARM]: showCreationModal = '' } = router.query

  const supportsRecovery = useIsRecoverySupported()
  const [recovery] = useRecovery()
  const showRecoveryWidget = supportsRecovery && !recovery

  return (
    <>
      <Grid container spacing={3}>
        {supportsRecovery && <RecoveryHeader />}

        <Grid item xs={12} lg={6}>
          <Overview />
        </Grid>

        {/* Note @chase: commenting this out since these txs are constructed differently than what's required to get timelock data
        <Grid item xs={12} lg={6}>
          <PendingTxsList />
        </Grid> */}

        <Grid item xs={12} lg={showRecoveryWidget ? 6 : undefined}>
          <FeaturedApps stackedLayout={!!showRecoveryWidget} />
        </Grid>

        {showRecoveryWidget ? (
          <Grid item xs={12} lg={6}>
            <RecoveryWidget />
          </Grid>
        ) : null}

        <Grid item xs={12}>
          <GovernanceSection />
        </Grid>

        <Grid item xs={12}>
          <SafeAppsDashboardSection />
        </Grid>
      </Grid>
      {showCreationModal ? <CreationDialog /> : null}
    </>
  )
}

export default Dashboard
