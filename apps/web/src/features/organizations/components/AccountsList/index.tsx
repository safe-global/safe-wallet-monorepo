import AddAccounts from '@/features/organizations/components/AddAccounts'
import { useMemo } from 'react'
import Image from 'next/image'
import { Typography, Paper, Box, Stack } from '@mui/material'
import type { AllSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import SafesList from '@/features/myAccounts/components/SafesList'
import EmptyDashboard from '@/public/images/orgs/empty_dashboard.png'

const EmptyAccountsList = () => {
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

          <AddAccounts />
        </Box>

        <Box sx={{}}>
          <Image src={EmptyDashboard} alt="Illustration of two safes with their thresholds" width={375} height={200} />
        </Box>
      </Stack>
    </Paper>
  )
}

const OrgAccountsList = ({ hasAccounts }: { hasAccounts: boolean }) => {
  // TODO: replace with data from CGW
  const safes = useAllSafesGrouped()
  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].slice(0, 5),
    [safes.allMultiChainSafes, safes.allSingleSafes],
  )

  if (!hasAccounts) {
    return <EmptyAccountsList />
  }

  return (
    <>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Safe Accounts ({allSafes.length})
      </Typography>
      <SafesList safes={allSafes} />
    </>
  )
}

export default OrgAccountsList
