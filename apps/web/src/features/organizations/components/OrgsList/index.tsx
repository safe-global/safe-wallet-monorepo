import AccountsNavigation from '@/features/myAccounts/components/AccountsNavigation'
import OrgsCard from '@/features/organizations/components/OrgsCard'
import OrgsCreationModal from '@/features/organizations/components/OrgsCreationModal'
import SignInButton from '@/features/organizations/components/SignInButton'
import OrgsIcon from '@/public/images/orgs/orgs.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { Box, Button, Card, Grid2, Link, Typography } from '@mui/material'
import { useOrganizationsGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useState } from 'react'
import css from './styles.module.css'

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
  return (
    <Card sx={{ p: 5, textAlign: 'center' }}>
      <OrgsIcon />

      <Typography color="text.secondary" mb={2}>
        To view your organization or create one, sign in with your connected wallet.
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

const OrgsList = () => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data: organizations } = useOrganizationsGetV1Query(undefined, { skip: !isUserSignedIn })

  return (
    <Box className={css.container}>
      <Box className={css.myOrgs}>
        <Box className={css.orgsHeader}>
          <AccountsNavigation />
          <AddOrgButton disabled={!isUserSignedIn} />
        </Box>

        {isUserSignedIn && organizations ? (
          <Grid2 container spacing={2} flexWrap="wrap">
            {organizations.length > 0 ? (
              organizations.map((org) => (
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
