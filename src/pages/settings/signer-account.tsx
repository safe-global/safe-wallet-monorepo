import { Grid, Paper, Typography } from '@mui/material'

import type { NextPage } from 'next'
import Head from 'next/head'

import SettingsHeader from '@/components/settings/SettingsHeader'
import SignerAccountMFA from '@/components/settings/SignerAccountMFA'
import ExportMPCAccount from '@/components/settings/ExportMPCAccount'

const SignerAccountPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{'Safe{Wallet} – Settings – Signer account'}</title>
      </Head>

      <SettingsHeader />

      <main>
        <Paper sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item lg={4} xs={12}>
              <Typography variant="h4" fontWeight="bold" mb={1}>
                Multi-factor Authentication
              </Typography>
            </Grid>

            <Grid item xs>
              <SignerAccountMFA />
            </Grid>
          </Grid>
        </Paper>
        <Paper sx={{ p: 4, mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item lg={4} xs={12}>
              <Typography variant="h4" fontWeight="bold" mb={1}>
                Account export
              </Typography>
            </Grid>
            <Grid item xs>
              <ExportMPCAccount />
            </Grid>
          </Grid>
        </Paper>
      </main>
    </>
  )
}

export default SignerAccountPage
