import { AppRoutes } from '@/config/routes'
import { Box, Card, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import css from './styles.module.css'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import classNames from 'classnames'
import { useOrgSafeCount } from '@/features/organizations/hooks/useOrgSafeCount'
import InitialsAvatar from '@/features/organizations/components/InitialsAvatar'
import OrgContextMenu from '@/features/organizations/components/OrgsCard/OrgContextMenu'
import { useIsAdmin } from '@/features/organizations/hooks/useOrgMembers'

export const OrgSummary = ({
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
    <Box className={css.orgInfo}>
      <Typography variant="body2" fontWeight="bold">
        {name}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" mt={isCompact ? 0 : 0.5}>
        <Typography variant="caption" color="text.secondary">
          {numberOfAccounts} Accounts
        </Typography>

        <div className={css.dot} />

        <Typography variant="caption" color="text.secondary">
          {numberOfMembers} Members
        </Typography>
      </Stack>
    </Box>
  )
}

const OrgsCard = ({
  org,
  isCompact = false,
  isLink = true,
}: {
  org: GetOrganizationResponse
  isCompact?: boolean
  isLink?: boolean
}) => {
  const { id, name, userOrganizations: members } = org
  const numberOfMembers = members.length
  const numberOfAccounts = useOrgSafeCount(id)
  const isAdmin = useIsAdmin(id)

  return (
    <Card className={classNames(css.card, { [css.compact]: isCompact })}>
      {isLink && (
        <Link className={css.cardLink} href={{ pathname: AppRoutes.organizations.index, query: { orgId: id } }} />
      )}

      <InitialsAvatar name={name} size={isCompact ? 'medium' : 'large'} />

      <OrgSummary
        name={name}
        numberOfAccounts={numberOfAccounts}
        numberOfMembers={numberOfMembers}
        isCompact={isCompact}
      />

      {isAdmin && <OrgContextMenu org={org} />}
    </Card>
  )
}

export default OrgsCard
