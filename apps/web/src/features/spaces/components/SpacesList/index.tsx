import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import SpaceCard from 'src/features/spaces/components/SpaceCard'
import SignInOptions from '../SignInOptions'
import SpacesIcon from '@/public/images/spaces/spaces.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { Box, Card, Grid2, Link, Typography } from '@mui/material'
import { Button } from '@/components/ui/button'
import { type GetSpaceResponse, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import SpaceListInvite from '../InviteBanner'
import { useCallback, useState } from 'react'
import css from './styles.module.css'
import { MemberStatus } from '@/features/spaces'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import SpaceInfoModal from '../SpaceInfoModal'
import { filterSpacesByStatus } from '@/features/spaces/utils'
import { AppRoutes } from '@/config/routes'
import NextLink from 'next/link'
import { useSignInRedirect } from '@/components/welcome/WelcomeLogin/hooks/useSignInRedirect'
import AddIcon from '@/public/images/common/add.svg'

const AddSpaceButton = () => {
  return (
    <Button
      data-testid="create-space-button"
      variant="default"
      size="lg"
      className="h-full rounded-lg px-6 text-base"
      render={<NextLink href={AppRoutes.welcome.createSpace} />}
    >
      <AddIcon className="size-5 fill-[var(--color-static-text-brand)]" />
      Create space
    </Button>
  )
}

const SignedOutState = ({ afterSignIn, redirectLoading }: { afterSignIn: () => void; redirectLoading: boolean }) => {
  return (
    <Card sx={{ p: 5, textAlign: 'center' }}>
      <Typography variant="h3" fontWeight={600} mb={3}>
        Sign in
      </Typography>

      <Typography color="text.secondary" mb={3}>
        Sign in to view or create a Space.
      </Typography>

      <SignInOptions afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
    </Card>
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
        <div className="h-12">
          <Track {...SPACE_EVENTS.CREATE_SPACE_MODAL} label={SPACE_LABELS.space_list_page}>
            <AddSpaceButton />
          </Track>
        </div>
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
  }, [setHasSignedIn])

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
          <>
            {activeSpaces.length > 0 ? (
              <Grid2 container spacing={2} flexWrap="wrap" data-testid="org-list">
                {activeSpaces.map((space) => (
                  <Grid2 size={{ xs: 12, md: 6 }} key={space.name}>
                    <SpaceCard space={space} currentUserId={currentUser?.id} />
                  </Grid2>
                ))}
              </Grid2>
            ) : (
              <NoSpacesState />
            )}
          </>
        ) : (
          <SignedOutState afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
        )}
      </Box>
    </Box>
  )
}

export default SpacesList
