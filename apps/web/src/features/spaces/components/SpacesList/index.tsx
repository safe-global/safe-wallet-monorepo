import AccountsNavigation from '@/features/myAccounts/components/AccountsNavigation'
import SpaceCard from 'src/features/spaces/components/SpaceCard'
import SpaceCreationModal from '@/features/spaces/components/SpaceCreationModal'
import SignInButton from '@/features/spaces/components/SignInButton'
import SpacesIcon from '@/public/images/spaces/spaces.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { Box, Button, Card, Grid2, Link, Typography } from '@mui/material'
import { type GetSpaceResponse, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import SpaceListInvite from '../InviteBanner'
import { useState } from 'react'
import css from './styles.module.css'
import { MemberStatus } from '@/features/spaces/hooks/useSpaceMembers'
import useWallet from '@/hooks/wallets/useWallet'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import SpaceInfoModal from '../SpaceInfoModal'
import { filterSpacesByStatus } from '@/features/spaces/utils'

const AddSpaceButton = ({ disabled }: { disabled: boolean }) => {
  const [openCreationModal, setOpenCreationModal] = useState<boolean>(false)

  return (
    <>
      <Button
        disableElevation
        variant="contained"
        size="small"
        onClick={() => setOpenCreationModal(true)}
        sx={{ height: '36px', px: 2 }}
        disabled={disabled}
      >
        <Box mt="1px">Create space</Box>
      </Button>
      {openCreationModal && <SpaceCreationModal onClose={() => setOpenCreationModal(false)} />}
    </>
  )
}

const SignedOutState = () => {
  const wallet = useWallet()
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <SpacesIcon />

        <Box mb={2}>
          <Typography color="text.secondary" mb={1}>
            To view your space or create one,{' '}
            {!!wallet ? 'sign in with your connected wallet.' : 'connect your wallet.'}
            <br />
          </Typography>
          <Link onClick={() => setIsInfoOpen(true)} href="#">
            What are spaces?
          </Link>
        </Box>

        <SignInButton />
      </Card>
      {isInfoOpen && <SpaceInfoModal onClose={() => setIsInfoOpen(false)} showButtons={false} />}
    </>
  )
}

const NoSpacesState = () => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)
  const [openCreationModal, setOpenCreationModal] = useState<boolean>(false)

  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center', width: 1 }}>
        <SpacesIcon />

        <Typography color="text.secondary" mb={1}>
          No spaces found.
          <br />
        </Typography>
        <Link onClick={() => setIsInfoOpen(true)} href="#">
          What are spaces?
        </Link>
      </Card>
      {isInfoOpen && (
        <SpaceInfoModal onCreateSpace={() => setOpenCreationModal(true)} onClose={() => setIsInfoOpen(false)} />
      )}
      {openCreationModal && <SpaceCreationModal onClose={() => setOpenCreationModal(false)} />}
    </>
  )
}

const SpacesList = () => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })

  const pendingInvites = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.INVITED)
  const activeSpaces = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.ACTIVE)

  return (
    <Box className={css.container}>
      <Box className={css.mySpaces}>
        <Box className={css.spacesHeader}>
          <AccountsNavigation />

          <Track {...SPACE_EVENTS.CREATE_SPACE_MODAL} label={SPACE_LABELS.space_list_page}>
            <AddSpaceButton disabled={!isUserSignedIn} />
          </Track>
        </Box>

        {isUserSignedIn &&
          pendingInvites.length > 0 &&
          pendingInvites.map((invitingSpace: GetSpaceResponse) => (
            <SpaceListInvite key={invitingSpace.id} space={invitingSpace} />
          ))}

        {isUserSignedIn ? (
          <Grid2 container spacing={2} flexWrap="wrap">
            {activeSpaces.length > 0 ? (
              activeSpaces.map((space) => (
                <Grid2 size={{ xs: 12, md: 6 }} key={space.name}>
                  <SpaceCard space={space} />
                </Grid2>
              ))
            ) : (
              <NoSpacesState />
            )}
          </Grid2>
        ) : (
          <SignedOutState />
        )}
      </Box>
    </Box>
  )
}

export default SpacesList
