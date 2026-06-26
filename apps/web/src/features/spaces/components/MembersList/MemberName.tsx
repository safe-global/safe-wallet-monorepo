import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Stack, Typography } from '@mui/material'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getMemberDisplayName } from '@/features/spaces'

const MemberName = ({ member, isCurrentUser }: { member: MemberDto; isCurrentUser: boolean }) => {
  const displayName = getMemberDisplayName(member)

  return (
    <Stack direction="row" spacing={1} alignItems="center" key={member.id}>
      <InitialsAvatar size="medium" name={displayName} rounded />
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
