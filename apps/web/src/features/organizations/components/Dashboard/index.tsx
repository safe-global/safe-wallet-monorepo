import { Box, Typography } from '@mui/material'
import css from './styles.module.css'
import SignInButton from '../SignInButton'

const OrganizationsDashboard = () => {
  return (
    <Box>
      <Typography variant="h1" className={css.title}>
        Dashboard
      </Typography>

      <Box className={css.content}>
        <Box className={css.loggedOut}>
          <Typography variant="h2" className={css.heading}>
            Sign in to see your organizations
          </Typography>

          <Typography variant="body2" className={css.description}>
            Description
          </Typography>

          <SignInButton />
        </Box>
      </Box>
    </Box>
  )
}

export default OrganizationsDashboard
