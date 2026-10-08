import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type NotificationsSettingsViewProps = {
  isNotificationFeatureEnabled?: boolean
  pushNotifications: ReactNode
}

export const NotificationsSettingsView = ({
  isNotificationFeatureEnabled,
  pushNotifications,
}: NotificationsSettingsViewProps) => {
  return (
    <main>
      {isNotificationFeatureEnabled === true ? (
        pushNotifications
      ) : isNotificationFeatureEnabled === false ? (
        <Typography align="center" className="my-6">
          Notifications are not available on this network.
        </Typography>
      ) : null}
    </main>
  )
}
