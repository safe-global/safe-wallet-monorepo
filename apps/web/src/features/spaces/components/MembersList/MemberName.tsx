import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Stack, Typography } from '@mui/material'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { getMemberDisplayName } from '../../hooks/useSpaceMembers'

const MemberName = ({ member }: { member: MemberDto }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const isCurrentUser = member.user.id === user?.id
  const displayName = getMemberDisplayName(member)

  return (
    <Stack direction="row" spacing={1} alignItems="center" key={member.id}>
      <InitialsAvatar size="medium" name={displayName || ''} rounded />
      <Typography variant="body2">
        {displayName}{' '}
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
