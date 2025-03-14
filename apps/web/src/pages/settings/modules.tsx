import { FallbackHandler } from '@/components/settings/FallbackHandler'
import SafeModules from '@/components/settings/SafeModules'
import SettingsHeader from '@/components/settings/SettingsHeader'
import TransactionGuards from '@/components/settings/TransactionGuards'
import { BRAND_NAME } from '@/config/constants'
import type { NextPage } from 'next'
import Head from 'next/head'

const Modules: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Modules`}</title>
      </Head>

      <SettingsHeader />

      <main>
        <SafeModules />

        <TransactionGuards />

        <FallbackHandler />
      </main>
    </>
  )
}

export default Modules
