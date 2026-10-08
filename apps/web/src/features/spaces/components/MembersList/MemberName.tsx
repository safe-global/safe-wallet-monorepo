import { isAddress } from 'ethers'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { getMemberDisplayName } from '../../hooks/useSpaceMembers'
import { MemberNameView } from '@views/features/spaces/components/MembersList/MemberNameView'

const MemberName = ({ member, isCompact = false }: { member: MemberDto; isCompact?: boolean }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const isCurrentUser = member.user.id === user?.id
  const displayName = getMemberDisplayName(member)
  const label = isAddress(displayName) ? shortenAddress(displayName) : displayName

  return (
    <MemberNameView
      memberId={member.id}
      displayName={displayName}
      label={label}
      isCompact={isCompact}
      isCurrentUser={isCurrentUser}
    />
  )
}

export default MemberName
