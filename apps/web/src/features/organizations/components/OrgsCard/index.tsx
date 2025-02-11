import { Box, Card, hslToRgb, Stack, Typography } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import IconButton from '@mui/material/IconButton'

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

type Organization = {
  name: string
  members: Array<object>
  safes: Array<object>
}

const OrgsCard = ({ org }: { org: Organization }) => {
  const orgName = org.name
  const numberOfAccounts = org.safes.length
  const numberOfMembers = org.members.length

  return (
    <Card className={css.card}>
      <OrgLogo orgName={orgName} />

      <Typography mt={2} variant="body2" fontWeight="bold">
        {orgName}
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
