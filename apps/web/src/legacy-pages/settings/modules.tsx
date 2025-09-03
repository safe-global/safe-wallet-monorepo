import type { NextPage } from 'next'
import Head from 'next/head'
import { Grid } from '@mui/material'
import SafeModules from '@/components/settings/SafeModules'
import TransactionGuards from '@/components/settings/TransactionGuards'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { FallbackHandler } from '@/components/settings/FallbackHandler'
import { BRAND_NAME } from '@/config/constants'

const Modules: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Modules`}</title>
      </Head>

      <SettingsHeader />

      <main>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <SafeModules />
          </Grid>

          <Grid item>
            <TransactionGuards />
          </Grid>

          <Grid item>
            <FallbackHandler />
          </Grid>
        </Grid>
      </main>
    </>
  )
}

export default Modules
