import { Box, Button, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'

const gradientBg = {
  background: 'linear-gradient(225deg, rgba(95, 221, 255, 0.15) 12.5%, rgba(18, 255, 128, 0.15) 88.07%)',
}

const OrgsDashboardWidget = () => {
  return (
    <Stack direction="row" flexWrap="wrap" gap={2} py={2} px={3} sx={gradientBg}>
      <Box flex={1} minWidth="60%">
        <Typography variant="h6" fontWeight="700" mb={2}>
          Organizations are here!
        </Typography>

        <Typography variant="body2">
          Organize your Safe Accounts, all in one place. Collaborate efficiently with your team members and simplify
          treasury management.
          <br />
          Available now in beta.
        </Typography>
      </Box>

      <Stack direction="row" gap={2} alignItems="center">
        <Track action="" category="" label="dashboard">
          <Link href="" passHref>
            <Button variant="outlined">Learn more</Button>
          </Link>
        </Track>

        <Track action="" category="" label="dashboard">
          <Link href={AppRoutes.organizations.dashboard} passHref>
            <Button variant="contained">Try now</Button>
          </Link>
        </Track>
      </Stack>
    </Stack>
  )
}

export default OrgsDashboardWidget
