import { Box, Typography } from '@mui/material'
import SignInButton from '@/features/organizations/components/SignInButton'
import css from './styles.module.css'

const OrganizationsDashboard = ({ organizationId }: { organizationId: string }) => {
  // TODO: use the organizationId to fetch the organization data
  console.log('organizationId', organizationId)

  return (
    <Box>
      <Typography variant="h1" fontWeight={700} mb={2}>
        Dashboard
      </Typography>

      <Box className={css.content}>
        <Box textAlign="center" p={3}>
          <Typography variant="h2" fontWeight={700} mb={1}>
            Sign in to see your organization
          </Typography>

          <Typography variant="body2" mb={2} color="primary.light">
            Description
          </Typography>

          <SignInButton />
        </Box>
      </Box>
    </Box>
  )
}

export default OrganizationsDashboard
