import AccountsNavigation from '@/features/myAccounts/components/AccountsNavigation'
import OrgsCard from '@/features/organizations/components/OrgsCard'
import OrgsCreationModal from '@/features/organizations/components/OrgsCreationModal'
import SignInButton from '@/features/organizations/components/SignInButton'
import OrgsIcon from '@/public/images/orgs/orgs.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { Box, Button, Card, Grid2, Link, Typography } from '@mui/material'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useOrganizationsGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import type { UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import OrgListInvite from '../Dashboard/DashboardInvite'
import { useState } from 'react'
import css from './styles.module.css'
import { MemberStatus } from '@/features/organizations/hooks/useOrgMembers'
import useWallet from '@/hooks/wallets/useWallet'

const AddOrgButton = ({ disabled }: { disabled: boolean }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        disableElevation
        variant="contained"
        size="small"
        onClick={() => setOpen(true)}
        sx={{ height: '36px', px: 2 }}
        disabled={disabled}
      >
        <Box mt="1px">Create organization</Box>
      </Button>
      {open && <OrgsCreationModal onClose={() => setOpen(false)} />}
    </>
  )
}

const InfoModal = () => {
  const openInfoModal = () => {
    // TODO: implement
  }

  return (
    <Link onClick={openInfoModal} href="#">
      What are organizations?
    </Link>
  )
}

const EmptyState = () => {
  const wallet = useWallet()

  return (
    <Card sx={{ p: 5, textAlign: 'center' }}>
      <OrgsIcon />

      <Typography color="text.secondary" mb={2}>
        To view your organization or create one,{' '}
        {!!wallet ? 'sign in with your connected wallet.' : 'connect your wallet.'}
        <br />
        <InfoModal />
      </Typography>

      <SignInButton />
    </Card>
  )
}

const NoOrgsState = () => {
  return (
    <Card sx={{ p: 5, textAlign: 'center', width: 1 }}>
      <OrgsIcon />

      <Typography color="text.secondary" mb={2}>
        No organizations found.
        <br />
        <InfoModal />
      </Typography>
    </Card>
  )
}

const filterOrgsByStatus = (
  currentUser: UserWithWallets | undefined,
  orgs: GetOrganizationResponse[],
  status: MemberStatus,
) => {
  return orgs?.filter((org) => {
    // @ts-ignore TODO: fix incorrect type from CGW
    return org.userOrganizations.some((userOrg) => userOrg.user.id === currentUser?.id && userOrg.status === status)
  })
}

// todo: replace with real data
const OrgsList = () => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { data: organizations } = useOrganizationsGetV1Query(undefined, { skip: !isUserSignedIn })

  const pendingInvites = filterOrgsByStatus(currentUser, organizations || [], MemberStatus.INVITED)
  const activeOrganizations = filterOrgsByStatus(currentUser, organizations || [], MemberStatus.ACTIVE)

  return (
    <Box className={css.container}>
      <Box className={css.myOrgs}>
        <Box className={css.orgsHeader}>
          <AccountsNavigation />
          <AddOrgButton disabled={!isUserSignedIn} />
        </Box>

        {isUserSignedIn &&
          pendingInvites.length > 0 &&
          pendingInvites.map((invitingOrg: GetOrganizationResponse) => (
            <OrgListInvite key={invitingOrg.id} org={invitingOrg} />
          ))}

        {isUserSignedIn && organizations ? (
          <Grid2 container spacing={2} flexWrap="wrap">
            {activeOrganizations.length > 0 ? (
              activeOrganizations.map((org) => (
                <Grid2 size={6} key={org.name}>
                  <OrgsCard org={org} />
                </Grid2>
              ))
            ) : (
              <NoOrgsState />
            )}
          </Grid2>
        ) : (
          <EmptyState />
        )}
      </Box>
    </Box>
  )
}

export default OrgsList
