import { Card, Typography } from '@mui/material'
import SafeAccountsIcon from '@/public/images/spaces/safe-accounts.svg'

const EmptySafeAccounts = () => {
  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <SafeAccountsIcon />

        <Typography color="text.secondary" mb={2}>
          Add existing Safe Accounts in your space to see them here.
        </Typography>
      </Card>
    </>
  )
}

export default EmptySafeAccounts
