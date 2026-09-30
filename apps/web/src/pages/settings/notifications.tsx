import Head from 'next/head'
import type { NextPage } from 'next'
import { Typography } from '@/components/ui/typography'

import SettingsHeader from '@/components/settings/SettingsHeader'
import { PushNotifications } from '@/components/settings/PushNotifications'
import { useHasFeature } from '@/hooks/useChains'
import { BRAND_NAME } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'

const NotificationsPage: NextPage = () => {
  const isNotificationFeatureEnabled = useHasFeature(FEATURES.PUSH_NOTIFICATIONS)

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Notifications`}</title>
      </Head>

      <SettingsHeader />

      <main>
        {isNotificationFeatureEnabled === true ? (
          <PushNotifications />
        ) : isNotificationFeatureEnabled === false ? (
          <Typography align="center" className="my-6">
            Notifications are not available on this network.
          </Typography>
        ) : null}
      </main>
    </>
  )
}

export default NotificationsPage
