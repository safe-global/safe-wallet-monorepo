import DataManagement from '@/components/settings/DataManagement'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { BRAND_NAME } from '@/config/constants'
import Head from 'next/head'

const Data = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Data`}</title>
      </Head>

      <SettingsHeader />

      <main>
        <DataManagement />
      </main>
    </>
  )
}

export default Data
