import { Box, Grid, Paper, Typography } from '@mui/material'
import css from './styles.module.css'
// import HiddenTokenButton from '@/components/balances/HiddenTokenButton'
// import CurrencySelect from '@/components/balances/CurrencySelect'
// import TokenListSelect from '@/components/balances/TokenListSelect'

const SuperChainEOAS = () => {
  return (
    <main className={css.container}>
      <Typography fontWeight={600} fontSize={16} marginBottom={1}>
        Account
      </Typography>
      <Paper
        style={{
          height: '100%',
        }}
      >
        <Grid container gap={2} height="100%" alignItems="center" justifyContent="center" p={4} flexDirection="column">
          <Box height="100%" width="100%">
            <Box alignItems="center" justifyContent="space-between" width="100%" flexDirection="row">
              <Typography variant="h3" fontWeight="bold">
                Connected wallets
              </Typography>
              more
            </Box>
          </Box>
        </Grid>
      </Paper>
    </main>
  )
}

export default SuperChainEOAS
