import { CookieAndTermBanner } from 'src/components/common/CookieAndTermBanner'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { Grid, Paper, Typography } from '@mui/material'
import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'

const Cookies: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Cookies`}</title>
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
              <CookieAndTermBanner />
            </Grid>
          </Grid>
        </Paper>
      </main>
    </>
  )
}

export default Cookies
