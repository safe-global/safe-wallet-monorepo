import { AppRoutes } from '@/config/routes'
import { Typography } from '@/components/ui/typography'
import Link from 'next/link'

import css from './styles.module.css'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import classNames from 'classnames'
import { isUserActiveAdmin } from '@/features/spaces/utils'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import SpaceContextMenu from './SpaceContextMenu'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

export const SpaceSummary = ({
  name,
  numberOfAccounts,
  numberOfMembers,
  isCompact = false,
}: {
  name: string
  numberOfAccounts: number
  numberOfMembers: number
  isCompact?: boolean
}) => {
  return (
    <div className={css.spaceInfo}>
      <Typography variant="paragraph-small-bold" data-testid="org-name">
        {name}
      </Typography>

      <div className={classNames('flex flex-row items-center gap-2', isCompact ? 'mt-0' : 'mt-0.5')}>
        <Typography variant="paragraph-mini" color="muted">
          {numberOfAccounts} Account{maybePlural(numberOfAccounts)}
        </Typography>

        <div className={css.dot} />

        <Typography variant="paragraph-mini" color="muted">
          {numberOfMembers} Member{maybePlural(numberOfMembers)}
        </Typography>
      </div>
    </div>
  )
}

const SpaceCard = ({
  space,
  isCompact = false,
  isLink = true,
  currentUserId,
}: {
  space: GetSpaceResponse
  isCompact?: boolean
  isLink?: boolean
  currentUserId?: number
}) => {
  const { uuid, name, members, safeCount, memberCount } = space
  const isAdmin = isUserActiveAdmin(members, currentUserId)

  const handleClick = () => {
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_SWITCHED, label: uuid },
      {
        from_workspace_id: undefined,
        to_workspace_id: uuid,
        source: 'space_selector',
        safe_count: safeCount,
      },
    )
  }

  return (
    <div
      data-testid="space-card"
      className={classNames('rounded-lg border border-border bg-card', css.card, { [css.compact]: isCompact })}
      onClick={isLink ? handleClick : undefined}
    >
      {isLink && (
        <Link className={css.cardLink} href={{ pathname: AppRoutes.spaces.index, query: { spaceId: uuid } }} />
      )}

      <InitialsAvatar name={name} size={isCompact ? 'medium' : 'large'} />

      <SpaceSummary name={name} numberOfAccounts={safeCount} numberOfMembers={memberCount} isCompact={isCompact} />

      {isAdmin && <SpaceContextMenu space={space} />}
    </div>
  )
}

export default SpaceCard
