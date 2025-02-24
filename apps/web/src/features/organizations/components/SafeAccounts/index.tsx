import AddAccounts from '@/features/organizations/components/AddAccounts'
import SafeAccountList from '@/features/organizations/components/SafeAccountList'
import EmptySafeAccounts from '@/features/organizations/components/SafeAccountList/EmptySafeAccounts'
import SearchIcon from '@/public/images/common/search.svg'
import { Stack, SvgIcon, TextField, Typography } from '@mui/material'
import InputAdornment from '@mui/material/InputAdornment'
import { useState } from 'react'

const OrganizationSafeAccounts = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const safeAccounts = [] // TODO: Fetch from backend

  return (
    <>
      <Typography variant="h1" mb={3}>
        Safe Accounts
      </Typography>
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

        <AddAccounts />
      </Stack>

      {/* TODO: Fix the condition once data is ready */}
      {safeAccounts.length !== 0 ? <EmptySafeAccounts /> : <SafeAccountList />}
    </>
  )
}

export default OrganizationSafeAccounts
