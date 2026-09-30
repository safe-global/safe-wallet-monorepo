import type { NextPage } from 'next'
import Head from 'next/head'
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
        <div className="flex flex-col gap-4">
          <div>
            <SafeModules />
          </div>

          <div>
            <TransactionGuards />
          </div>

          <div>
            <FallbackHandler />
          </div>
        </div>
      </main>
    </>
  )
}

export default Modules
