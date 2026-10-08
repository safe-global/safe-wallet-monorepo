import type { ReactNode } from 'react'
import { AppRoutes } from '@/config/routes'
import Link from 'next/link'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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

export type SpaceCardNewViewProps = {
  uuid: string
  name: string
  safeCount: number
  memberCount: number
  isLink: boolean
  logoColor: string
  isAdmin: boolean
  contextMenu: ReactNode
}

export function SpaceCardNewView({
  uuid,
  name,
  safeCount,
  memberCount,
  isLink,
  logoColor,
  isAdmin,
  contextMenu,
}: SpaceCardNewViewProps) {
  const logoLetter = name.slice(0, 1).toUpperCase()

  return (
    <Card
      data-testid="space-card-new"
      // eslint-disable-next-line no-restricted-syntax -- bespoke 3-col card grid: tight gap-2 + p-4 padding (no CardContent slot); not a Card size
      className="relative grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] gap-2 p-4"
      size="sm"
    >
      {isLink && (
        <Link
          className="absolute left-0 top-0 size-full"
          href={{ pathname: AppRoutes.spaces.index, query: { spaceId: uuid } }}
          aria-label={`Go to ${name}`}
        />
      )}

      <Avatar size="default" className="col-span-2 shrink-0 rounded-[6px] ring-2 ring-border">
        <AvatarFallback style={{ backgroundColor: logoColor }} className="rounded-[6px] text-white font-bold">
          {logoLetter}
        </AvatarFallback>
      </Avatar>

      <SpaceSummaryNew name={name} numberOfAccounts={safeCount} numberOfMembers={memberCount} />

      {isAdmin && <div className="relative z-10 col-start-3 flex items-start">{contextMenu}</div>}
    </Card>
  )
}
