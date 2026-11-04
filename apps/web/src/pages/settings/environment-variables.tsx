import Head from 'next/head'
import SettingsHeader from '@/components/settings/SettingsHeader'
import EnvironmentVariables from '@/components/settings/EnvironmentVariables'
import { BRAND_NAME } from '@/config/constants'

const EnvironmentVariablesPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Environment variables`}</title>
      </Head>

      <SettingsHeader />

      <main>
        <EnvironmentVariables />
      </main>
    </>
  )
}

export default EnvironmentVariablesPage
