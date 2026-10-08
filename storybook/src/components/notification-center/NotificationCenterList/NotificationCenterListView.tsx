import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { List } from '@/components/ui/list'
import NoNotificationsIcon from '@/public/images/notifications/no-notifications.svg'
import css from './styles.module.css'

export type NotificationCenterListViewProps = {
  isEmpty: boolean
  items: ReactNode
}

export function NotificationCenterListView({ isEmpty, items }: NotificationCenterListViewProps): ReactElement {
  if (isEmpty) {
    return (
      <div className={css.wrapper}>
        <NoNotificationsIcon data-testid="notifications-icon" alt="No notifications" />
        <Typography className="pt-2">No notifications</Typography>
      </div>
    )
  }

  return (
    <div className={css.scrollContainer}>
      <List className="p-0">{items}</List>
    </div>
  )
}
