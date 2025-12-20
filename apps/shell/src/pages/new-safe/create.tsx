import { type ReactElement } from 'react'
import { Box, Container, Typography, Paper } from '@mui/material'

/**
 * Create Safe page - Safe creation flow
 * TODO: Implement Safe creation wizard
 */
const CreateSafePage = (): ReactElement => {
  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Create new Safe
        </Typography>

        <Paper elevation={1} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Safe Creation Wizard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This feature will be implemented in a future update.
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={2}>
            The wizard will guide you through:
          </Typography>
          <Box component="ul" mt={1}>
            <li>Selecting a network</li>
            <li>Configuring owners and threshold</li>
            <li>Reviewing and deploying your Safe</li>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default CreateSafePage
