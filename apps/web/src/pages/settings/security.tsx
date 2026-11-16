import Head from 'next/head'

import SettingsHeader from '@/components/settings/SettingsHeader'
import SecurityLogin from '@/components/settings/SecurityLogin'
import { BRAND_NAME } from '@/config/constants'

const SecurityPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Security`}</title>
      </Head>

      <SettingsHeader />

      <main>
        <SecurityLogin />
      </main>
    </>
  )
}

export default SecurityPage
