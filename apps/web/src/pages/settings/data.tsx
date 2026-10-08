import DataManagement from '@/components/settings/DataManagement'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { BRAND_NAME } from '@/config/constants'
import { PageMainView } from '@views/pages/PageMainView'
import type { NextPage } from 'next'
import Head from 'next/head'

const Data: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Data`}</title>
      </Head>

      <SettingsHeader />

      <PageMainView>
        <DataManagement />
      </PageMainView>
    </>
  )
}

export default Data
