import { InitialsAvatar } from '../OrgsCard'
import { Stack, Typography } from '@mui/material'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'

const MemberName = ({ member }: { member: UserOrganization }) => {
  return (
    <Stack direction="row" spacing={1} alignItems="center" key={member.id}>
      <InitialsAvatar size="medium" orgName={member.name || ''} rounded />
      <Typography fontSize="14px">{member.name}</Typography>
    </Stack>
  )
}

export default MemberName
