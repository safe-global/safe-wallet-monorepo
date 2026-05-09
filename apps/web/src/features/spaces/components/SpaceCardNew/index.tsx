import { AppRoutes } from '@/config/routes'
import Link from 'next/link'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MemberStatus, useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { getDeterministicColor } from '@/features/spaces/components/InitialsAvatar'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
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
      <Typography variant="paragraph-small-medium">{name}</Typography>

      <div className="mt-0.5 flex items-center gap-2">
        <Typography variant="paragraph-mini" color="muted">
          {numberOfAccounts} Account{maybePlural(numberOfAccounts)}
        </Typography>

        <div className="bg-border size-0.5 rounded-full" />

        <Typography variant="paragraph-mini" color="muted">
          {numberOfMembers} Member{maybePlural(numberOfMembers)}
        </Typography>
      </div>
    </div>
  )
}

const SpaceCardNew = ({ space, isLink = true }: { space: GetSpaceResponse; isLink?: boolean }) => {
  const { id, name, members, safeCount } = space
  const numberOfMembers = members.filter((member) => member.status === MemberStatus.ACTIVE).length
  const numberOfAccounts = safeCount
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
