import { AppRoutes } from '@/config/routes'
import { Box, Card, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import css from './styles.module.css'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import classNames from 'classnames'
import { isUserActiveAdmin } from '@/features/spaces/utils'
import { MemberStatus } from '@/features/spaces'
import InitialsAvatar from '../InitialsAvatar'
import SpaceContextMenu from './SpaceContextMenu'
import { maybePlural } from '@safe-global/utils/utils/formatters'

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
    <Box className={css.spaceInfo}>
      <Typography variant="body2" fontWeight="bold">
        {name}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" mt={isCompact ? 0 : 0.5}>
        <Typography variant="caption" color="text.secondary">
          {numberOfAccounts} Account{maybePlural(numberOfAccounts)}
        </Typography>

        <div className={css.dot} />

        <Typography variant="caption" color="text.secondary">
          {numberOfMembers} Member{maybePlural(numberOfMembers)}
        </Typography>
      </Stack>
    </Box>
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
  const { id, name, members, safeCount } = space
  const numberOfMembers = members.filter((member) => member.status === MemberStatus.ACTIVE).length
  const isAdmin = isUserActiveAdmin(members, currentUserId)

  return (
    <Card data-testid="space-card" className={classNames(css.card, { [css.compact]: isCompact })}>
      {isLink && <Link className={css.cardLink} href={{ pathname: AppRoutes.spaces.index, query: { spaceId: id } }} />}

      <InitialsAvatar name={name} size={isCompact ? 'medium' : 'large'} />

      <SpaceSummary name={name} numberOfAccounts={safeCount} numberOfMembers={numberOfMembers} isCompact={isCompact} />

      {isAdmin && <SpaceContextMenu space={space} />}
    </Card>
  )
}

export default SpaceCard
