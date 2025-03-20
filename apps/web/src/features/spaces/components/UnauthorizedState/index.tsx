import { Box, Typography } from '@mui/material'
import css from '@/features/spaces/components/Dashboard/styles.module.css'
import Button from '@mui/material/Button'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'

const UnauthorizedState = () => {
  return (
    <Box className={css.content}>
      <Box textAlign="center" p={3}>
        <Typography variant="h2" fontWeight={700} mb={2}>
          Nothing to see here
        </Typography>

        <Link href={AppRoutes.welcome.spaces} passHref>
          <Button variant="contained">Back to overview</Button>
        </Link>
      </Box>
    </Box>
  )
}

export default UnauthorizedState
