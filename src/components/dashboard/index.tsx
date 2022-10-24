import type { ReactElement } from 'react'
import { Grid } from '@mui/material'
import PendingTxsList from '@/components/dashboard/PendingTxs/PendingTxsList'
import Overview from '@/components/dashboard/Overview/Overview'
import { FeaturedApps } from '@/components/dashboard/FeaturedApps/FeaturedApps'
import SafeAppsDashboardSection from '@/components/dashboard/SafeAppsDashboardSection/SafeAppsDashboardSection'
import GovernanceSection from '@/components/dashboard/GovernanceSection/GovernanceSection'

const Dashboard = (): ReactElement => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12} lg={6}>
        <Overview />
      </Grid>

      <Grid item xs={12} md={6}>
        <PendingTxsList size={4} />
      </Grid>

      <Grid item xs={12}>
        <GovernanceSection />
      </Grid>

      <Grid item xs={12}>
        <FeaturedApps />
      </Grid>

      <Grid item xs={12}>
        <SafeAppsDashboardSection />
      </Grid>
    </Grid>
  )
}

export default Dashboard
