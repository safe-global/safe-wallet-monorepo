import { Box, Stack, Typography } from '@mui/material'
import { useBalances } from './hooks/useBalances'
import AppLoader from './components/AppLoader'
import DrainForm from './components/DrainForm'

function App() {
  const { assets, loaded, error } = useBalances()

  if (!loaded) return <AppLoader />

  return (
    <Stack component="main" gap={2} sx={{ maxWidth: 800, p: 4 }}>
      <Stack direction="row" alignItems="center">
        <Box component="img" src="./logo.svg" alt="" sx={{ height: '3em', mr: 1.25 }} />
        <Typography variant="h4" component="h1">
          Drain Account
        </Typography>
      </Stack>

      {error && <Typography color="error">Failed fetching balances: {error.message}</Typography>}

      {assets.length > 0 && <DrainForm assets={assets} />}

      {!error && assets.length === 0 && <Typography>{"You don't have any transferable assets"}</Typography>}
    </Stack>
  )
}

export default App
