import Head from 'next/head'
import type { NextPage } from 'next'

import SettingsHeader from '@/components/settings/SettingsHeader'
import { PushNotifications } from '@/components/settings/PushNotifications'
import { useHasFeature } from '@/hooks/useChains'
import { BRAND_NAME } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'

const NotificationsPage: NextPage = () => {
  const isNotificationFeatureEnabled = useHasFeature(FEATURES.PUSH_NOTIFICATIONS)

  if (!isNotificationFeatureEnabled) {
    return null
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Notifications`}</title>
      </Head>

      <SettingsHeader />

      <main>
        <PushNotifications />
      </main>
    </>
  )
}

export default NotificationsPage
