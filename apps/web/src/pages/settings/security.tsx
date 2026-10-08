import type { NextPage } from 'next'
import Head from 'next/head'

import SettingsHeader from '@/components/settings/SettingsHeader'
import SecurityLogin from '@/components/settings/SecurityLogin'
import { BRAND_NAME } from '@/config/constants'
import { PageMainView } from '@views/pages/PageMainView'

const SecurityPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Security`}</title>
      </Head>

      <SettingsHeader />

      <PageMainView>
        <SecurityLogin />
      </PageMainView>
    </>
  )
}

export default SecurityPage
