import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { cn } from '@/utils/cn'
import { getMemberDisplayName } from '../../hooks/useSpaceMembers'

const MemberName = ({ member, isCompact = false }: { member: MemberDto; isCompact?: boolean }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const isCurrentUser = member.user.id === user?.id
  const displayName = getMemberDisplayName(member)

  return (
    <div className="flex min-w-0 flex-row items-center gap-2" key={member.id}>
      <InitialsAvatar size="medium" name={displayName || ''} rounded />
      <Tooltip>
        <TooltipTrigger
          render={
            <Typography variant="paragraph-small" className={cn('min-w-0 text-left', !isCompact && 'truncate')} />
          }
        >
          {displayName}
        </TooltipTrigger>
        <TooltipContent align="start" data-testid="member-name-tooltip">
          {displayName}
        </TooltipContent>
      </Tooltip>
      {isCurrentUser && (
        <Typography variant="paragraph-small" color="muted" className="shrink-0">
          You
        </Typography>
      )}
    </div>
  )
}

export default MemberName
