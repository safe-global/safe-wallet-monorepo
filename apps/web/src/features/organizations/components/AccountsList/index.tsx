import { Typography, Paper, Box, Button } from '@mui/material'
import type { AllSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { useAllSafesGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import SafesList from '@/features/myAccounts/components/SafesList'
import { useMemo } from 'react'

const EmptyAccountsList = () => {
  return (
    <Paper sx={{ p: 3, display: 'flex', gap: 3 }}>
      <Box sx={{ flex: 2 }}>
        <Typography variant="h4" fontWeight={700} mb={2}>
          Link your Safe Accounts
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3} fontSize="small">
          To set up your organisation you need to add existing Safe Accounts. Any accounts that are associated with your
          connected wallet can be added to the organisation space.
        </Typography>

        <Button variant="contained" onClick={() => {}}>
          Add existing account
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Image Placeholder
        </Typography>
      </Box>
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
