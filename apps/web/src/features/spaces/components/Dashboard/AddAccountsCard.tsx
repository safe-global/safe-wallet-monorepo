import AddAccounts from '@/features/spaces/components/AddAccounts'
import Image from 'next/image'
import { Typography, Paper, Box, Stack } from '@mui/material'
import EmptyDashboard from '@/public/images/spaces/empty_dashboard.png'
import EmptyDashboardDark from '@/public/images/spaces/empty_dashboard_dark.png'

import css from './styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { useDarkMode } from '@/hooks/useDarkMode'

const AddAccountsCard = () => {
  const isDarkMode = useDarkMode()

  return (
    <Paper sx={{ p: 3, display: 'flex', gap: 3 }}>
      <Stack direction={{ xs: 'column-reverse', md: 'row' }} alignItems="center" spacing={3}>
        <Box sx={{ flex: 2 }}>
          <Typography variant="h4" fontWeight={700} mb={2}>
            Add your Safe Accounts
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={2}>
            Start by adding Safe Accounts to your space. Any accounts that are linked to your connected wallet can be
            added to the space.
          </Typography>

          <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.space_dashboard_card}>
            <AddAccounts />
          </Track>
        </Box>

        <Box>
          <Image
            className={css.image}
            src={isDarkMode ? EmptyDashboardDark : EmptyDashboard}
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
