import { type ReactElement } from 'react'
import { Box, Container, Typography, Paper } from '@mui/material'

/**
 * Load Safe page - Add existing Safe
 * TODO: Implement Safe loading form
 */
const LoadSafePage = (): ReactElement => {
  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Add existing Safe
        </Typography>

        <Paper elevation={1} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Add Safe Form
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This feature will be implemented in a future update.
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={2}>
            You will be able to add an existing Safe by providing:
          </Typography>
          <Box component="ul" mt={1}>
            <li>Network/Chain</li>
            <li>Safe address</li>
            <li>Optional: Safe name</li>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoadSafePage
