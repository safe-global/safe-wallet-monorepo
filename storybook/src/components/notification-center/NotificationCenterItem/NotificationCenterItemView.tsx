import InfoIcon from '@/public/images/notifications/info.svg'
import WarningIcon from '@/public/images/notifications/warning.svg'
import ErrorIcon from '@/public/images/notifications/error.svg'
import SuccessIcon from '@/public/images/notifications/success.svg'
import type { ReactElement, ReactNode } from 'react'
import type { Notification } from '@/store/notificationsSlice'
import UnreadBadge from '@/components/common/UnreadBadge'
import { formatTimeInWords } from '@safe-global/utils/utils/date'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import classnames from 'classnames'

type NotificationVariant = Notification['variant']

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

export type NotificationCenterItemViewProps = {
  isRead?: boolean
  variant: NotificationVariant
  message: string
  title?: string
  timestamp: number
  requiresAction: boolean
  notificationLink: ReactNode
}

export function NotificationCenterItemView({
  isRead,
  variant,
  message,
  title,
  timestamp,
  requiresAction,
  notificationLink,
}: NotificationCenterItemViewProps): ReactElement {
  const secondaryText = (
    <span className={css.secondaryText}>
      <span>{formatTimeInWords(timestamp)}</span>
      {notificationLink}
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
      <div className="flex min-w-0 flex-1 flex-col">
        {primaryText}
        {secondaryText}
      </div>
    </li>
  )
}
