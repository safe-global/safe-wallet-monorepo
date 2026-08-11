import type { ReactElement } from 'react'

import { Typography } from '@/components/ui/typography'
import { List } from '@/components/ui/list'
import type { NotificationState } from '@/store/notificationsSlice'
import NotificationCenterItem from '@/components/notification-center/NotificationCenterItem'
import NoNotificationsIcon from '@/public/images/notifications/no-notifications.svg'

import css from './styles.module.css'

type NotificationCenterListProps = {
  notifications: NotificationState
  handleClose: () => void
}

const NotificationCenterList = ({ notifications, handleClose }: NotificationCenterListProps): ReactElement => {
  if (!notifications.length) {
    return (
      <div className={css.wrapper}>
        <NoNotificationsIcon data-testid="notifications-icon" alt="No notifications" />
        <Typography className="pt-2">No notifications</Typography>
      </div>
    )
  }

  return (
    <div className={css.scrollContainer}>
      <List className="p-0">
        {notifications.map((notification) => (
          <NotificationCenterItem key={notification.id} {...notification} handleClose={handleClose} />
        ))}
      </List>
    </div>
  )
}

export default NotificationCenterList
