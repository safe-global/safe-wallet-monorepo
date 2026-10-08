import type { NextPage } from 'next'
import Head from 'next/head'

import SafeAppsPermissions from '@/components/settings/SafeAppsPermissions'
import SettingsHeader from '@/components/settings/SettingsHeader'
import { SafeAppsSigningMethod } from '@/components/settings/SafeAppsSigningMethod'
import { BRAND_NAME } from '@/config/constants'
import { PageMainView } from '@views/pages/PageMainView'

const SafeAppsPermissionsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Safe Apps`}</title>
      </Head>

      <SettingsHeader />

      <PageMainView>
        <SafeAppsPermissions />
        <SafeAppsSigningMethod />
      </PageMainView>
    </>
  )
}

export default SafeAppsPermissionsPage
