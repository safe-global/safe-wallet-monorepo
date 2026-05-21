import { Box, Stack, Typography, alpha } from '@mui/material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'

const LocalSafesAlert = () => {
  const allAdded = useAppSelector(selectAllAddedSafes)
  const count = Object.values(allAdded ?? {}).reduce((sum, safes) => sum + Object.keys(safes).length, 0)

  if (count === 0) return null

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      data-testid="local-safes-alert"
      sx={{
        mb: 2,
        mx: 'auto',
        p: 2,
        width: '100%',
        maxWidth: 350,
        textAlign: 'left',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'success.main',
        backgroundColor: (theme) => alpha(theme.palette.success.main, 0.08),
      }}
    >
      <AccountBalanceWalletIcon sx={{ color: 'success.main' }} />
      <Box>
        <Typography fontWeight={700}>
          {count} {count === 1 ? 'Safe' : 'Safes'} detected on this browser
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to resume where you left off.
        </Typography>
      </Box>
    </Stack>
  )
}

export default LocalSafesAlert
