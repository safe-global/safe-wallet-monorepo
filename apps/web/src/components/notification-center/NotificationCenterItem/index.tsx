import { NotificationLink } from '@/components/common/Notifications'
import type { ReactElement } from 'react'
import type { Notification } from '@/store/notificationsSlice'
import { NotificationCenterItemView } from '@views/components/notification-center/NotificationCenterItem/NotificationCenterItemView'

const NotificationCenterItem = ({
  isRead,
  variant,
  message,
  timestamp,
  link,
  handleClose,
  title,
}: Notification & { handleClose: () => void }): ReactElement => {
  const requiresAction = !isRead && !!link

  return (
    <NotificationCenterItemView
      isRead={isRead}
      variant={variant}
      message={message}
      title={title}
      timestamp={timestamp}
      requiresAction={requiresAction}
      notificationLink={<NotificationLink link={link} onClick={handleClose} />}
    />
  )
}

export default NotificationCenterItem
