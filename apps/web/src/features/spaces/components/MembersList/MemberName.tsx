import InitialsAvatar from '../InitialsAvatar'
import { Stack, Typography } from '@mui/material'
import type { Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'

const MemberName = ({ member }: { member: Member }) => {
  const { currentData: user } = useUsersGetWithWalletsV1Query()
  const isCurrentUser = member.user.id === user?.id

  return (
    <Stack direction="row" spacing={1} alignItems="center" key={member.id}>
      <InitialsAvatar size="medium" name={member.name || ''} rounded />
      <Typography variant="body2">
        {member.name}{' '}
        {isCurrentUser && (
          <Typography variant="body2" component="span" color="text.secondary" ml={1}>
            you
          </Typography>
        )}
      </Typography>
    </Stack>
  )
}

export default MemberName
