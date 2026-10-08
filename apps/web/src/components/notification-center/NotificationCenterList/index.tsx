import type { ReactElement } from 'react'
import type { NotificationState } from '@/store/notificationsSlice'
import NotificationCenterItem from '@/components/notification-center/NotificationCenterItem'
import { NotificationCenterListView } from '@views/components/notification-center/NotificationCenterList/NotificationCenterListView'

type NotificationCenterListProps = {
  notifications: NotificationState
  handleClose: () => void
}

const NotificationCenterList = ({ notifications, handleClose }: NotificationCenterListProps): ReactElement => {
  return (
    <NotificationCenterListView
      isEmpty={!notifications.length}
      items={notifications.map((notification) => (
        <NotificationCenterItem key={notification.id} {...notification} handleClose={handleClose} />
      ))}
    />
  )
}

export default NotificationCenterList
