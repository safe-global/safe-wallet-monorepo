import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export type MemberNameViewProps = {
  memberId: number
  displayName: string
  label: string
  isCompact: boolean
  isCurrentUser: boolean
}

export const MemberNameView = ({ memberId, displayName, label, isCompact, isCurrentUser }: MemberNameViewProps) => {
  return (
    <div className="flex min-w-0 flex-row items-center gap-2" key={memberId}>
      <InitialsAvatar size="medium" name={displayName || ''} rounded />
      <Tooltip>
        <TooltipTrigger
          render={
            <Typography variant="paragraph-small" className={cn('min-w-0 text-left', !isCompact && 'truncate')} />
          }
        >
          {label}
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
