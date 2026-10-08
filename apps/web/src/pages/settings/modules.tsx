import type { NextPage } from 'next'
import Head from 'next/head'
import SafeModules from '@/components/settings/SafeModules'
import TransactionGuards from '@/components/settings/TransactionGuards'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { FallbackHandler } from '@/components/settings/FallbackHandler'
import { BRAND_NAME } from '@/config/constants'
import { ModulesSettingsView } from '@views/pages/settings/ModulesSettingsView'

const Modules: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Modules`}</title>
      </Head>

      <SettingsHeader />

      <ModulesSettingsView
        safeModules={<SafeModules />}
        transactionGuards={<TransactionGuards />}
        fallbackHandler={<FallbackHandler />}
      />
    </>
  )
}

export default Modules
