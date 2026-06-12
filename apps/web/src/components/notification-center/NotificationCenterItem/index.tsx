import InfoIcon from '@/public/images/notifications/info.svg'
import WarningIcon from '@/public/images/notifications/warning.svg'
import ErrorIcon from '@/public/images/notifications/error.svg'
import SuccessIcon from '@/public/images/notifications/success.svg'
import { NotificationLink } from '@/components/common/Notifications'
import type { ReactElement } from 'react'

import type { Notification } from '@/store/notificationsSlice'

type NotificationVariant = Notification['variant']
import UnreadBadge from '@/components/common/UnreadBadge'
import { formatTimeInWords } from '@safe-global/utils/utils/date'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'
import classnames from 'classnames'

const VARIANT_ICONS = {
  error: ErrorIcon,
  info: InfoIcon,
  success: SuccessIcon,
  warning: WarningIcon,
}

const VARIANT_COLORS: Record<NotificationVariant, string> = {
  error: 'text-[var(--color-error-main)]',
  info: 'text-[var(--color-info-main)]',
  success: 'text-[var(--color-success-main)]',
  warning: 'text-[var(--color-warning-main)]',
}

const getNotificationIcon = (variant: NotificationVariant): ReactElement => {
  const Icon = VARIANT_ICONS[variant]
  return <Icon className={classnames('fill-current', VARIANT_COLORS[variant])} />
}

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

  const secondaryText = (
    <span className={css.secondaryText}>
      <span>{formatTimeInWords(timestamp)}</span>
      <NotificationLink link={link} onClick={handleClose} />
    </span>
  )

  const primaryText = (
    <>
      {title && <Typography className="font-bold">{title}</Typography>}
      <Typography>{message}</Typography>
    </>
  )

  return (
    <li className={classnames(css.item, { [css.requiresAction]: requiresAction }, 'flex items-center gap-3')}>
      <div className={classnames(css.avatar, 'flex items-center')}>
        <UnreadBadge
          invisible={isRead}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {getNotificationIcon(variant)}
        </UnreadBadge>
      </div>
      <div className="flex min-w-0 flex-col">
        {primaryText}
        {secondaryText}
      </div>
    </li>
  )
}

export default NotificationCenterItem
