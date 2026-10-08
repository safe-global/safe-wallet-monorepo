import Head from 'next/head'
import type { NextPage } from 'next'

import SettingsHeader from '@/components/settings/SettingsHeader'
import { PushNotifications } from '@/components/settings/PushNotifications'
import { useHasFeature } from '@/hooks/useChains'
import { BRAND_NAME } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { NotificationsSettingsView } from '@views/pages/settings/NotificationsSettingsView'

const NotificationsPage: NextPage = () => {
  const isNotificationFeatureEnabled = useHasFeature(FEATURES.PUSH_NOTIFICATIONS)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Notifications`}</title>
      </Head>

      <SettingsHeader />

      <NotificationsSettingsView
        isNotificationFeatureEnabled={isNotificationFeatureEnabled}
        pushNotifications={<PushNotifications />}
      />
    </>
  )
}

export default NotificationsPage
