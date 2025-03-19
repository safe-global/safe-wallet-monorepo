import AddAccounts from '@/features/organizations/components/AddAccounts'
import Image from 'next/image'
import { Typography, Paper, Box, Stack } from '@mui/material'
import EmptyDashboard from '@/public/images/orgs/empty_dashboard.png'
import css from './styles.module.css'
import { ORG_EVENTS, ORG_LABELS } from '@/services/analytics/events/organizations'
import Track from '@/components/common/Track'

const AddAccountsCard = () => {
  return (
    <Paper sx={{ p: 3, display: 'flex', gap: 3 }}>
      <Stack direction={{ xs: 'column-reverse', md: 'row' }} alignItems="center" spacing={3}>
        <Box sx={{ flex: 2 }}>
          <Typography variant="h4" fontWeight={700} mb={2}>
            Add your Safe Accounts
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={2}>
            Start by adding Safe Accounts to your organization. Any accounts that are linked to your connected wallet
            can be added to the organisation space.
          </Typography>

          <Track {...ORG_EVENTS.ADD_ACCOUNTS_MODAL} label={ORG_LABELS.org_dashboard_card}>
            <AddAccounts />
          </Track>
        </Box>

        <Box>
          <Image
            className={css.image}
            src={EmptyDashboard}
            alt="Illustration of two safes with their thresholds"
            width={375}
            height={200}
          />
        </Box>
      </Stack>
    </Paper>
  )
}

export default AddAccountsCard
