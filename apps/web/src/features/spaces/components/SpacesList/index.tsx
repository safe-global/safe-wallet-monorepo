import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import { EmailAuthFeature } from '@/features/email-auth'
import SpaceCard from 'src/features/spaces/components/SpaceCard'
import SignInButton from '../SignInButton'
import SpacesIcon from '@/public/images/spaces/spaces.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { Box, Button, Card, Grid2, Link, Stack, Typography } from '@mui/material'
import { type GetSpaceResponse, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import SpaceListInvite from '../InviteBanner'
import { useCallback, useState } from 'react'
import css from './styles.module.css'
import { MemberStatus } from '@/features/spaces'
import useWallet from '@/hooks/wallets/useWallet'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import SpaceInfoModal from '../SpaceInfoModal'
import { filterSpacesByStatus } from '@/features/spaces/utils'
import { AppRoutes } from '@/config/routes'
import NextLink from 'next/link'
import { useSignInRedirect } from '@/components/welcome/WelcomeLogin/hooks/useSignInRedirect'

const AddSpaceButton = () => {
  return (
    <Button
      data-testid="create-space-button"
      disableElevation
      variant="contained"
      size="small"
      href={AppRoutes.welcome.createSpace}
      LinkComponent={NextLink}
      sx={{ height: '36px' }}
    >
      <Box mt="1px">Create space</Box>
    </Button>
  )
}

const SignedOutState = ({ afterSignIn, redirectLoading }: { afterSignIn: () => void; redirectLoading: boolean }) => {
  const wallet = useWallet()
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)
  const { EmailSignInButton } = useLoadFeature(EmailAuthFeature)

  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <Box display="flex" justifyContent="center">
          <SpacesIcon />
        </Box>

        <Box mb={3}>
          <Typography color="text.secondary" mb={1}>
            To view your space or create one,{' '}
            {!!wallet ? 'sign in with your connected wallet or email.' : 'connect your wallet or sign in with email.'}
            <br />
          </Typography>
          <Link onClick={() => setIsInfoOpen(true)} href="#">
            What are spaces?
          </Link>
        </Box>

        <Stack direction="row" justifyContent="center" spacing={2} alignItems="center">
          <EmailSignInButton />
          <SignInButton afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
        </Stack>
      </Card>
      {isInfoOpen && <SpaceInfoModal onClose={() => setIsInfoOpen(false)} showButtons={false} />}
    </>
  )
}

const NoSpacesState = () => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center', width: 1 }}>
        <Box display="flex" justifyContent="center">
          <SpacesIcon />
        </Box>

        <Box mb={3}>
          <Typography color="text.secondary" mb={1}>
            No spaces found.
            <br />
          </Typography>
          <Link onClick={() => setIsInfoOpen(true)} href="#">
            What are spaces?
          </Link>
        </Box>
        <Track {...SPACE_EVENTS.CREATE_SPACE_MODAL} label={SPACE_LABELS.space_list_page}>
          <AddSpaceButton />
        </Track>
      </Card>
      {isInfoOpen && <SpaceInfoModal onClose={() => setIsInfoOpen(false)} />}
    </>
  )
}

const SpacesList = () => {
  const { AccountsNavigation } = useLoadFeature(MyAccountsFeature)
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const {
    currentData: spaces,
    isFetching: isSpacesLoading,
    error,
  } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })
  const pendingInvites = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.INVITED)
  const activeSpaces = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.ACTIVE)
  const inviteAmount = pendingInvites?.length

  const { setHasSignedIn, redirectLoading } = useSignInRedirect({
    spacesAmount: spaces?.length || 0,
    inviteAmount: inviteAmount || 0,
    isSpacesLoading: isSpacesLoading || false,
    error: error || undefined,
  })

  const afterSignIn = useCallback(() => {
    setHasSignedIn(true)
  }, [])

  return (
    <Box className={css.container}>
      <Box className={css.mySpaces}>
        <Box className={css.spacesHeader}>
          <AccountsNavigation />

          {isUserSignedIn && activeSpaces.length > 0 && (
            <Track {...SPACE_EVENTS.CREATE_SPACE_MODAL} label={SPACE_LABELS.space_list_page}>
              <AddSpaceButton />
            </Track>
          )}
        </Box>

        {isUserSignedIn &&
          pendingInvites.length > 0 &&
          pendingInvites.map((invitingSpace: GetSpaceResponse) => (
            <SpaceListInvite key={invitingSpace.id} space={invitingSpace} />
          ))}

        {isUserSignedIn || (!redirectLoading && pendingInvites.length) ? (
          <Grid2 container spacing={2} flexWrap="wrap">
            {activeSpaces.length > 0 ? (
              activeSpaces.map((space) => (
                <Grid2 size={{ xs: 12, md: 6 }} key={space.name}>
                  <SpaceCard space={space} currentUserId={currentUser?.id} />
                </Grid2>
              ))
            ) : (
              <NoSpacesState />
            )}
          </Grid2>
        ) : (
          <SignedOutState afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
        )}
      </Box>
    </Box>
  )
}

export default SpacesList
