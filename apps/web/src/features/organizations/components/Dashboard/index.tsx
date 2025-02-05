import { Box, Typography, Button } from '@mui/material'
import css from './styles.module.css'

const OrganizationsDashboard = () => {
  return (
    <Box>
      <Typography variant="h1" className={css.title}>
        Dashboard
      </Typography>

      <Box className={css.content}>
        <Box className={css.loggedOut}>
          <Typography variant="h2" className={css.heading}>
            Sign in to see your organisations
          </Typography>

          <Typography variant="body2" className={css.description}>
            Description
          </Typography>

          <Button variant="contained" className={css.signInButton}>
            Sign in
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default OrganizationsDashboard
