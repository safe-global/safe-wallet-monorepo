import AddAccounts from '@/features/organizations/components/AddAccounts'
import EmptySafeAccounts from '@/features/organizations/components/SafeAccounts/EmptySafeAccounts'
import SearchIcon from '@/public/images/common/search.svg'
import { Stack, SvgIcon, TextField, Typography } from '@mui/material'
import InputAdornment from '@mui/material/InputAdornment'
import { useState } from 'react'
import SafesList from '@/features/myAccounts/components/SafesList'
import { useOrgSafes } from '@/features/organizations/hooks/useOrgSafes'
import { useSafesSearch } from '@/features/myAccounts/hooks/useSafesSearch'
import { useIsAdmin, useIsInvited } from '@/features/organizations/hooks/useOrgMembers'
import PreviewInvite from '../InviteBanner/PreviewInvite'

const OrganizationSafeAccounts = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const allSafes = useOrgSafes()
  const filteredSafes = useSafesSearch(allSafes, searchQuery)
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  const safes = searchQuery ? filteredSafes : allSafes

  return (
    <>
      {isInvited && <PreviewInvite />}
      <Typography variant="h1" mb={3}>
        Safe Accounts
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} mb={3} flexWrap="wrap">
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

      {searchQuery && filteredSafes.length === 0 ? (
        <Typography variant="h5" fontWeight="normal" mb={2} color="primary.light">
          Found 0 results
        </Typography>
      ) : safes.length === 0 ? (
        <EmptySafeAccounts />
      ) : (
        <SafesList safes={safes} isOrgSafe />
      )}
    </>
  )
}

export default OrganizationSafeAccounts
