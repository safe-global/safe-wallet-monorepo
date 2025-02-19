import { AppRoutes } from '@/config/routes'
import { Box, Card, hslToRgb, Stack, Typography } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import IconButton from '@mui/material/IconButton'
import Link from 'next/link'

import css from './styles.module.css'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import classNames from 'classnames'

/**
 * Returns a deterministic "random" color (in Hex format) based on a string.
 * The color is constrained so it won't be too dark or too light or too saturated.
 */
export function getDeterministicColor(str: string): string {
  const sum = [...str].reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const hue = sum % 360
  const saturation = 40 + (sum % 31)
  const lightness = 40 + (sum % 31)

  return hslToRgb(`hsl(${hue}, ${saturation}, ${lightness})`)
}

export const OrgLogo = ({ orgName, size = 'large' }: { orgName: string; size?: 'small' | 'medium' | 'large' }) => {
  const logoLetters = orgName.slice(0, 2)
  const logoColor = getDeterministicColor(orgName)

  const dimensions = {
    small: { width: 24, height: 24, fontSize: '12px !important' },
    medium: { width: 32, height: 32, fontSize: '16px !important' },
    large: { width: 48, height: 48, fontSize: '20px !important' },
  }

  const { width, height, fontSize } = dimensions[size]

  return (
    <Box className={css.orgLogo} bgcolor={logoColor} width={width} height={height} fontSize={fontSize}>
      {logoLetters}
    </Box>
  )
}

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
  const safes = []
  const numberOfAccounts = safes.length
  const numberOfMembers = members.length

  return (
    <Card className={classNames(css.card, { [css.compact]: isCompact })}>
      {isLink && <Link className={css.cardLink} href={AppRoutes.organizations.index(id.toString())} />}

      <Box className={css.orgLogo}>
        <OrgLogo orgName={name} size={isCompact ? 'medium' : 'large'} />
      </Box>

      <OrgSummary
        name={name}
        numberOfAccounts={numberOfAccounts}
        numberOfMembers={numberOfMembers}
        isCompact={isCompact}
      />

      <IconButton className={css.orgActions} size="small" onClick={() => {}}>
        <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
      </IconButton>
    </Card>
  )
}

export default OrgsCard
