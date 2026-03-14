import BackLink from '@/components/common/BackLink'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getDeterministicColor } from '@/features/spaces'

type SpaceBackLinkProps = {
  space: { id: number; name: string }
  onClick: () => void
}

function SpaceBackLink({ space, onClick }: SpaceBackLinkProps) {
  return (
    <BackLink onClick={onClick} ariaLabel="Back to space">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback
          className="rounded-md text-primary-foreground text-sm font-semibold"
          style={{ backgroundColor: getDeterministicColor(space.name) }}
        >
          {space.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </BackLink>
  )
}

export default SpaceBackLink
