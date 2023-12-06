import { Box, Grid, Paper, Typography } from '@mui/material'
import SocialSignerMFA from './SocialSignerMFA'
import SocialSignerExport from './SocialSignerExport'
import useWallet from '@/hooks/wallets/useWallet'
import { isSocialLoginWallet } from '@/services/mpc/SocialLoginModule'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { Recovery } from '../Recovery'
import SpendingLimits from '../SpendingLimits'

const SecurityLogin = () => {
  const isRecoverySupported = useHasFeature(FEATURES.RECOVERY)
  const wallet = useWallet()
  const isSocialLogin = isSocialLoginWallet(wallet?.label)

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {isRecoverySupported && <Recovery />}

      {isSocialLogin && (
        <>
          <Paper sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid item lg={4} xs={12}>
                <Typography variant="h4" fontWeight="bold" mb={1}>
                  Multi-factor Authentication
                </Typography>
              </Grid>

              <Grid item xs>
                <SocialSignerMFA />
              </Grid>
            </Grid>
          </Paper>
          <Paper sx={{ p: 4, mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item lg={4} xs={12}>
                <Typography variant="h4" fontWeight="bold" mb={1}>
                  Social login signer export
                </Typography>
              </Grid>
              <Grid item xs>
                <SocialSignerExport />
              </Grid>
            </Grid>
          </Paper>
        </>
      )}

      <SpendingLimits />
    </Box>
  )
}

export default SecurityLogin
