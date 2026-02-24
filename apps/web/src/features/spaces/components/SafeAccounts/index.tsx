import AddAccounts from '../AddAccounts'
import EmptySafeAccounts from './EmptySafeAccounts'
import { Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import { useSafesSearch } from '@/hooks/safes'
import { useSpaceSafes, useIsAdmin, useIsInvited } from '@/features/spaces'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import SearchInput from '../SearchInput'

const SpaceSafeAccounts = () => {
  const { SafesList } = useLoadFeature(MyAccountsFeature)
  const [searchQuery, setSearchQuery] = useState('')
  const { allSafes } = useSpaceSafes()
  const filteredSafes = useSafesSearch(allSafes ?? [], searchQuery)
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  const safes = searchQuery ? filteredSafes : allSafes

  useEffect(() => {
    if (searchQuery) {
      trackEvent({ ...SPACE_EVENTS.SEARCH_ACCOUNTS, label: SPACE_LABELS.accounts_page })
    }
  }, [searchQuery])

  return (
    <>
      {isInvited && <PreviewInvite />}
      <Typography variant="h1" mb={3}>
        Safe Accounts
      </Typography>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={2}
        mb={3}
        flexWrap="nowrap"
        flexDirection={{ xs: 'column-reverse', md: 'row' }}
      >
        <SearchInput onSearch={setSearchQuery} />

        {isAdmin && (
          <Track {...SPACE_EVENTS.ADD_ACCOUNTS_MODAL} label={SPACE_LABELS.accounts_page}>
            <AddAccounts />
          </Track>
        )}
      </Stack>

      {searchQuery && filteredSafes.length === 0 ? (
        <Typography variant="h5" fontWeight="normal" mb={2} color="primary.light">
          Found 0 results
        </Typography>
      ) : safes.length === 0 ? (
        <EmptySafeAccounts />
      ) : (
        <SafesList safes={safes} isSpaceSafe />
      )}
    </>
  )
}

export default SpaceSafeAccounts
