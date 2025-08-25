import InitialsAvatar from '../InitialsAvatar'
import { Stack, Typography } from '@mui/material'
import type { Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

const MemberName = ({ member }: { member: Member }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const isCurrentUser = member.user.id === user?.id

  return (
    <Stack direction="row" spacing={1} alignItems="center" key={member.id}>
      <InitialsAvatar size="medium" name={member.name || ''} rounded />
      <Typography variant="body2">
        {member.name}{' '}
        {isCurrentUser && (
          <Typography variant="body2" component="span" color="text.secondary" ml={1}>
            You
          </Typography>
        )}
      </Typography>
    </Stack>
  )
}

export default MemberName
