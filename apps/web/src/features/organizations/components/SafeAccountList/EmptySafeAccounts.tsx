import { useState } from 'react'
import { Button, Card, Stack, SvgIcon, TextField, Typography } from '@mui/material'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@/public/images/common/search.svg'
import SafeAccountsIcon from '@/public/images/orgs/safe-accounts.svg'

const EmptySafeAccounts = () => {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
        <TextField
          placeholder="Search"
          variant="filled"
          hiddenLabel
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SvgIcon component={SearchIcon} inheritViewBox color="border" fontSize="small" />
              </InputAdornment>
            ),
            disableUnderline: true,
          }}
          size="small"
        />

        <Button size="compact" variant="contained" onClick={() => {}}>
          Add Safe Account
        </Button>
      </Stack>
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <SafeAccountsIcon />

        <Typography color="text.secondary" mb={2}>
          Add existing Safe Accounts in your organization space to see them here.
        </Typography>
      </Card>
    </>
  )
}

export default EmptySafeAccounts
