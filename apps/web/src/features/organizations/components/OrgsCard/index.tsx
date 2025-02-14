import { AppRoutes } from '@/config/routes'
import { Box, Card, hslToRgb, Stack, Typography } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import IconButton from '@mui/material/IconButton'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import Link from 'next/link'

import css from './styles.module.css'

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

const OrgLogo = ({ orgName }: { orgName: string }) => {
  const logoLetters = orgName.slice(0, 2)
  const logoColor = getDeterministicColor(orgName)

  return (
    <Box className={css.orgLogo} bgcolor={logoColor}>
      {logoLetters}
    </Box>
  )
}

const OrgsCard = ({ org }: { org: GetOrganizationResponse }) => {
  const { id, name, userOrganizations: members } = org
  const safes = []
  const numberOfAccounts = safes.length
  const numberOfMembers = members.length

  return (
    <Card className={css.card}>
      <Link className={css.cardLink} href={AppRoutes.organizations.index(id.toString())} />

      <OrgLogo orgName={name} />

      <Typography mt={2} variant="body2" fontWeight="bold">
        {name}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
        <Typography variant="caption" color="text.secondary">
          {numberOfAccounts} Accounts
        </Typography>

        <div className={css.dot} />

        <Typography variant="caption" color="text.secondary">
          {numberOfMembers} Members
        </Typography>
      </Stack>

      <IconButton className={css.orgActions} size="small" onClick={() => {}}>
        <MoreVertIcon sx={({ palette }) => ({ color: palette.border.main })} />
      </IconButton>
    </Card>
  )
}

export default OrgsCard
