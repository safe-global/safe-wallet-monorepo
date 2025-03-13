import AddAccounts from '@/features/organizations/components/AddAccounts'
import EmptySafeAccounts from '@/features/organizations/components/SafeAccounts/EmptySafeAccounts'
import SearchIcon from '@/public/images/common/search.svg'
import { Stack, SvgIcon, TextField, Typography } from '@mui/material'
import InputAdornment from '@mui/material/InputAdornment'
import { useState } from 'react'
import SafesList from '@/features/myAccounts/components/SafesList'
import { useOrgSafes } from '@/features/organizations/hooks/useOrgSafes'
import { useSafesSearch } from '@/features/myAccounts/hooks/useSafesSearch'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import SignedOutState from '@/features/organizations/components/SignedOutState'
import { useIsAdmin } from '@/features/organizations/hooks/useIsAdmin'

const OrganizationSafeAccounts = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const allSafes = useOrgSafes()
  const filteredSafes = useSafesSearch(allSafes, searchQuery)
  const isAdmin = useIsAdmin()

  const safes = searchQuery ? filteredSafes : allSafes

  if (!isUserSignedIn) return <SignedOutState />

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

        {isAdmin && <AddAccounts />}
      </Stack>

      {/* TODO: Fix the condition once data is ready */}
      {safes.length === 0 ? <EmptySafeAccounts /> : <SafesList safes={safes} isOrgSafe />}
    </>
  )
}

export default OrganizationSafeAccounts
