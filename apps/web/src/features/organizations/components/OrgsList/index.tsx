import AccountsNavigation from '@/features/myAccounts/components/AccountsNavigation'
import OrgsCard from '@/features/organizations/components/OrgsCard'
import SignInButton from '@/features/organizations/components/SignInButton'
import OrgsIcon from '@/public/images/orgs/orgs.svg'
import { Box, Button, Card, Link, Stack, Typography } from '@mui/material'
import css from './styles.module.css'

const AddOrgButton = ({ onClick, disabled }: { onClick?: () => void; disabled: boolean }) => {
  return (
    <Button
      disableElevation
      variant="contained"
      size="small"
      onClick={onClick}
      sx={{ height: '36px', px: 2 }}
      disabled={disabled}
    >
      <Box mt="1px">Create organization</Box>
    </Button>
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

const ORGS = [
  {
    name: 'Safe DAO',
    id: 1,
    members: [{ id: 1 }, { id: 2 }, { id: 3 }],
    safes: [{ id: 1 }, { id: 4 }, { id: 2 }],
  },
  {
    name: 'Optimism Foundation',
    id: 2,
    members: [{ id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }],
    safes: [{ id: 1 }, { id: 4 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }],
  },
]

const OrgsList = () => {
  const isUserSignedIn = true // TODO: Implement logged in state once endpoint is ready

  return (
    <Box className={css.container}>
      <Box className={css.myOrgs}>
        <Box className={css.orgsHeader}>
          <AccountsNavigation />
          <AddOrgButton disabled={!isUserSignedIn} />
        </Box>

        {isUserSignedIn ? (
          <Stack direction="row" spacing={2}>
            {ORGS.length > 0 ? ORGS.map((org) => <OrgsCard org={org} key={org.name} />) : <NoOrgsState />}
          </Stack>
        ) : (
          <EmptyState />
        )}
      </Box>
    </Box>
  )
}

export default OrgsList
