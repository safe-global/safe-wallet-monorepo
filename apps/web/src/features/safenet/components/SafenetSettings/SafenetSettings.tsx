import { SafenetGuardDisplay, SafenetModuleDisplay } from '@/features/safenet/components/SafenetContractDisplay'
import useSafeInfo from '@/hooks/useSafeInfo'
import SafenetLogo from '@/public/images/logo-safenet.svg'
import { Box, Button, Grid, Paper, Typography } from '@mui/material'

const SafenetSettings = () => {
  const { safe } = useSafeInfo()

  const disableSafenet = () => {
    // TODO: Handle Safenet opt out
  }

  if (!safe.guard || safe.modules?.length !== 1) return

  return (
    <Paper sx={{ p: 4, mb: 2 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Grid item lg={4} xs={12}>
          <SafenetLogo />
        </Grid>

        <Grid item xs>
          <Box>
            <Typography sx={{ pb: 2 }}>
              Safenet unlocks a unified and secure experience across networks, so you no longer need to worry about
              bridging.
            </Typography>

            <Typography>
              Safenet Guard and Module are enabled to enhance security and customization. Modules adjust access control,
              while Guards add extra security checks before transactions.
            </Typography>

            <SafenetModuleDisplay name={safe.modules[0].name} address={safe.modules[0].value} chainId={safe.chainId} />

            <SafenetGuardDisplay name={safe.guard.name} address={safe.guard.value} chainId={safe.chainId} />

            <Button onClick={disableSafenet} sx={{ mt: 2 }} variant="outlined" size="small">
              Disable Safenet
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default SafenetSettings
