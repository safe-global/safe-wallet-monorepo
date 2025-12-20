import { type ReactElement } from 'react'
import { Box, Container, Typography, Button, Paper } from '@mui/material'
import { useRouter } from 'next/router'
import { ShellRoutes } from '@/config/routes'
import { BRAND_NAME } from '@/config/constants'

/**
 * Welcome page - entry point for new users
 * Provides options to create or load a Safe
 */
const WelcomePage = (): ReactElement => {
  const router = useRouter()

  const handleCreateSafe = () => {
    router.push(ShellRoutes.newSafe.create)
  }

  const handleLoadSafe = () => {
    router.push(ShellRoutes.newSafe.load)
  }

  const handleViewAccounts = () => {
    router.push(ShellRoutes.welcome.accounts)
  }

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="calc(100vh - 64px)"
        gap={4}
      >
        <Box textAlign="center">
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Welcome to {BRAND_NAME}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            The most trusted decentralized custody protocol and collective asset management platform
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={2} width="100%" maxWidth={400}>
          <Paper elevation={2}>
            <Button variant="contained" size="large" fullWidth onClick={handleCreateSafe} sx={{ py: 2 }}>
              Create new Safe
            </Button>
          </Paper>

          <Paper elevation={2}>
            <Button variant="outlined" size="large" fullWidth onClick={handleLoadSafe} sx={{ py: 2 }}>
              Add existing Safe
            </Button>
          </Paper>

          <Paper elevation={2}>
            <Button variant="text" size="large" fullWidth onClick={handleViewAccounts} sx={{ py: 2 }}>
              View my Safes
            </Button>
          </Paper>
        </Box>

        <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>
          Connect your wallet to get started
        </Typography>
      </Box>
    </Container>
  )
}

export default WelcomePage
