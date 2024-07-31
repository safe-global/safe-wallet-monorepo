import { CookieBanner } from '@/components/common/CookieBanner'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { Grid, Paper, Typography } from '@mui/material'
import type { NextPage } from 'next'
import Head from 'next/head'

const Cookies: NextPage = () => {
  return (
    <>
      <Head>
        <title>{'SuperChain SA – Settings – Cookies'}</title>
      </Head>

      <SettingsHeader />

      <main>
        <Paper sx={{ p: 4, mb: 2 }}>
          <Grid container spacing={3}>
            <Grid item sm={4} xs={12}>
              <Typography variant="h4" fontWeight={700}>
                Cookie preferences
              </Typography>
            </Grid>

            <Grid item container xs>
              <CookieBanner />
            </Grid>
          </Grid>
        </Paper>
      </main>
    </>
  )
}

export default Cookies
