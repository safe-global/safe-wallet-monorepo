import { CookieAndTermBanner } from 'src/components/common/CookieAndTermBanner'
import SettingsHeader from '@/components/settings/SettingsHeader'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { NextPage } from 'next'
import Head from 'next/head'

const Cookies: NextPage = () => {
  return (
    <>
      <Head>
        <title>{'Safe{Wallet} – Settings – Cookies'}</title>
      </Head>
      <SettingsHeader />
      <main>
        <Paper sx={{ p: 4, mb: 2 }}>
          <Grid container spacing={3}>
            <Grid item sm={4} xs={12}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                }}
              >
                Cookie preferences
              </Typography>
            </Grid>

            <Grid item container xs>
              <CookieAndTermBanner />
            </Grid>
          </Grid>
        </Paper>
      </main>
    </>
  )
}

export default Cookies
