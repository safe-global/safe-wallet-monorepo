import { CircularProgress, Stack, Typography } from '@mui/material'

function AppLoader() {
  return (
    <Stack alignItems="center" justifyContent="center" gap={2} sx={{ height: '100vh' }}>
      <Typography variant="h4" component="p">
        Waiting for Safe...
      </Typography>
      <CircularProgress />
    </Stack>
  )
}

export default AppLoader
