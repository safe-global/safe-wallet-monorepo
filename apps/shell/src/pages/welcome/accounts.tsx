import { type ReactElement } from 'react'
import { Box, Container, Typography, Button, Paper, List, ListItem, ListItemText } from '@mui/material'
import { useRouter } from 'next/router'
import { ShellRoutes } from '@/config/routes'
import { useWallet } from '@/hooks/useWallet'

/**
 * Accounts page - shows list of user's Safes
 * TODO: Integrate with Safe API to fetch actual Safe accounts
 */
const AccountsPage = (): ReactElement => {
  const router = useRouter()
  const { wallet } = useWallet()

  const handleCreateSafe = () => {
    router.push(ShellRoutes.newSafe.create)
  }

  const handleAddSafe = () => {
    router.push(ShellRoutes.newSafe.load)
  }

  // TODO: Fetch actual Safes from Safe API
  const safes: Array<{ address: string; chainId: string; name?: string }> = []

  if (!wallet) {
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
          <Typography variant="h4" gutterBottom>
            Connect your wallet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please connect your wallet to view your Safe accounts
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">
            My Safe Accounts
          </Typography>
          <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={handleAddSafe}>
              Add Safe
            </Button>
            <Button variant="contained" onClick={handleCreateSafe}>
              Create Safe
            </Button>
          </Box>
        </Box>

        {safes.length === 0 ? (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No Safe accounts found
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Create a new Safe or add an existing one to get started
            </Typography>
            <Box display="flex" gap={2} justifyContent="center" mt={3}>
              <Button variant="contained" onClick={handleCreateSafe}>
                Create new Safe
              </Button>
              <Button variant="outlined" onClick={handleAddSafe}>
                Add existing Safe
              </Button>
            </Box>
          </Paper>
        ) : (
          <List>
            {safes.map((safe) => (
              <ListItem
                key={`${safe.chainId}:${safe.address}`}
                component={Paper}
                elevation={1}
                sx={{ mb: 2, cursor: 'pointer' }}
              >
                <ListItemText primary={safe.name || safe.address} secondary={`Chain ID: ${safe.chainId}`} />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Container>
  )
}

export default AccountsPage
