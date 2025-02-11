import { Box, Card, Stack, Typography } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import IconButton from '@mui/material/IconButton'

import css from './styles.module.css'

/**
 * Deterministically returns a color from a set of colors
 * based on a seed e.g. the first two letters of a word
 * @param seed
 */
const getRandomColor = (seed: string) => {
  const colors = ['#8247E5', '#28a0f0'] // TODO: Add more colors
  const sum = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const index = sum % colors.length

  return colors[index]
}

const OrgLogo = ({ orgName }: { orgName: string }) => {
  const logoLetters = orgName.slice(0, 2)
  const logoColor = getRandomColor(logoLetters)

  return (
    <Box className={css.orgLogo} bgcolor={logoColor}>
      {logoLetters}
    </Box>
  )
}

const OrgsCard = () => {
  const orgName = 'Safe DAO'
  const numberOfAccounts = 12
  const numberOfMembers = 13

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
