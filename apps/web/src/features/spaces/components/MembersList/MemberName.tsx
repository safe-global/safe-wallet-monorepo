import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Typography } from '@/components/ui/typography'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

const MemberName = ({ member }: { member: MemberDto }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const isCurrentUser = member.user.id === user?.id

  return (
    <div className="flex flex-row items-center gap-2" key={member.id}>
      <InitialsAvatar size="medium" name={member.name || ''} rounded />
      <Typography variant="paragraph-small">
        {member.name}{' '}
        {isCurrentUser && (
          <Typography variant="paragraph-small" color="muted" className="ml-2">
            You
          </Typography>
        )}
      </Typography>
    </div>
  )
}

export default MemberName
