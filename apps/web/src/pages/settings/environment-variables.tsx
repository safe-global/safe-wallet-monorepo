import type { NextPage } from 'next'
import Head from 'next/head'
import SettingsHeader from '@/components/settings/SettingsHeader'
import EnvironmentVariables from '@/components/settings/EnvironmentVariables'
import { BRAND_NAME } from '@/config/constants'
import { PageMainView } from '@views/pages/PageMainView'

const EnvironmentVariablesPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Environment variables`}</title>
      </Head>

      <SettingsHeader />

      <PageMainView>
        <EnvironmentVariables />
      </PageMainView>
    </>
  )
}

export default EnvironmentVariablesPage
