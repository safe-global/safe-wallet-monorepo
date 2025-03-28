import { Box, CircularProgress } from '@mui/material'

const LoadingState = () => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress aria-label="Loading content" />
    </Box>
  )
}

export default LoadingState
