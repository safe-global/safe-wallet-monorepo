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

const EmptyState = () => {
  const openInfoModal = () => {
    // TODO: implement
  }

  return (
    <Card sx={{ p: 5, textAlign: 'center' }}>
      <OrgsIcon />

      <Typography color="text.secondary" mb={2}>
        To view your organization or create one, sign in with your connected wallet.
        <br />
        <Link onClick={openInfoModal} href="#">
          What are organizations?
        </Link>
      </Typography>

      <SignInButton />
    </Card>
  )
}

const ORGS = [
  {
    name: 'Safe DAO',
    members: [{ id: 1 }, { id: 2 }, { id: 3 }],
    safes: [{ id: 1 }, { id: 4 }, { id: 2 }],
  },
  {
    name: 'Optimism Foundation',
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
            {ORGS.map((org) => (
              <OrgsCard org={org} key={org.name} />
            ))}
          </Stack>
        ) : (
          <EmptyState />
        )}
      </Box>
    </Box>
  )
}

export default OrgsList
