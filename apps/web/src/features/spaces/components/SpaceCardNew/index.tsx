import { AppRoutes } from '@/config/routes'
import Link from 'next/link'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useSpaceSafeCount } from '@/features/spaces/hooks/useSpaceSafeCount'
import { MemberStatus, useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { getDeterministicColor } from '@/features/spaces/components/InitialsAvatar'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import SpaceContextMenuNew from './SpaceContextMenuNew'

export const SpaceSummaryNew = ({
  name,
  numberOfAccounts,
  numberOfMembers,
}: {
  name: string
  numberOfAccounts: number
  numberOfMembers: number
}) => {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-sm font-semibold">{name}</div>

      <div className="mt-0.5 flex items-center gap-2">
        <span className="text-muted-foreground text-xs">
          {numberOfAccounts} Account{maybePlural(numberOfAccounts)}
        </span>

        <div className="bg-border size-0.5 rounded-full" />

        <span className="text-muted-foreground text-xs">
          {numberOfMembers} Member{maybePlural(numberOfMembers)}
        </span>
      </div>
    </div>
  )
}

const SpaceCardNew = ({ space, isLink = true }: { space: GetSpaceResponse; isLink?: boolean }) => {
  const { id, name, members } = space
  const numberOfMembers = members.filter((member) => member.status === MemberStatus.ACTIVE).length
  const numberOfAccounts = useSpaceSafeCount(id)
  const isAdmin = useIsAdmin(id)

  const logoColor = getDeterministicColor(name)
  const logoLetter = name.slice(0, 1).toUpperCase()

  return (
    <Card
      data-testid="space-card-new"
      className="relative grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] gap-2 p-4"
      size="sm"
    >
      {isLink && (
        <Link
          className="absolute left-0 top-0 size-full"
          href={{ pathname: AppRoutes.spaces.index, query: { spaceId: id } }}
          aria-label={`Go to ${name}`}
        />
      )}

      <Avatar size="default" className="col-span-2 shrink-0 rounded-[6px] ring-2 ring-border">
        <AvatarFallback style={{ backgroundColor: logoColor }} className="rounded-[6px] text-white font-bold">
          {logoLetter}
        </AvatarFallback>
      </Avatar>

      <SpaceSummaryNew name={name} numberOfAccounts={numberOfAccounts} numberOfMembers={numberOfMembers} />

      {isAdmin && (
        <div className="relative z-10 col-start-3 flex items-start">
          <SpaceContextMenuNew space={space} />
        </div>
      )}
    </Card>
  )
}

export default SpaceCardNew
