import BackLink from '@/components/common/BackLink'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getAvatarColor } from '@/features/spaces/components/Sidebar/variants/SpaceSelectorDropdown'

type SpaceBackLinkProps = {
  space: { id: number; name: string }
  onClick: () => void
}

function SpaceBackLink({ space, onClick }: SpaceBackLinkProps) {
  return (
    <BackLink onClick={onClick}>
      <Avatar className="size-8 shrink-0">
        <AvatarFallback
          className="rounded-md text-primary-foreground text-sm font-semibold"
          style={{ backgroundColor: getAvatarColor(space.id) }}
        >
          {space.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </BackLink>
  )
}

export default SpaceBackLink
