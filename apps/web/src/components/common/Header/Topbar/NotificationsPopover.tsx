import { forwardRef, useImperativeHandle, type MouseEvent, type ReactElement } from 'react'
import Popover from '@mui/material/Popover'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MuiLink from '@mui/material/Link'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import SvgIcon from '@mui/material/SvgIcon'
import Link from 'next/link'
import { useRouter } from 'next/router'

import NotificationCenterList from '@/components/notification-center/NotificationCenterList'
import UnreadBadge from '@/components/common/UnreadBadge'
import notificationCss from '@/components/notification-center/NotificationCenter/styles.module.css'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import useNotificationsPopover from './hooks/useNotificationsPopover'

const NOTIFICATION_CENTER_LIMIT = 4

export type NotificationsPopoverRef = {
  handleClick: (event: MouseEvent<HTMLButtonElement>) => void
  unreadCount: number
}

const NotificationsPopover = forwardRef<NotificationsPopoverRef>((_props, ref): ReactElement => {
  const router = useRouter()
  const hasPushNotifications = useHasFeature(FEATURES.PUSH_NOTIFICATIONS)

  const {
    notifications,
    notificationsToShow,
    unreadCount,
    open,
    anchorEl,
    showAll,
    setShowAll,
    canExpand,
    handleClick,
    handleClose,
    handleClear,
  } = useNotificationsPopover()

  useImperativeHandle(ref, () => ({
    handleClick,
    unreadCount,
  }))

  const ExpandIcon = showAll ? ExpandLessIcon : ExpandMoreIcon

  const onSettingsClick = () => {
    setTimeout(handleClose, 300)
  }

  return (
    <Popover
      key={Number(open)}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      sx={{ '& > .MuiPaper-root': { top: 'var(--header-height) !important' } }}
      transitionDuration={0}
    >
      <Paper className={notificationCss.popoverContainer}>
        <div className={notificationCss.popoverHeader}>
          <div>
            <Typography variant="h4" component="span" fontWeight={700}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography variant="caption" className={notificationCss.unreadCount}>
                {unreadCount}
              </Typography>
            )}
          </div>
          {notifications.length > 0 && (
            <MuiLink onClick={handleClear} variant="body2" component="button" sx={{ textDecoration: 'unset' }}>
              Clear all
            </MuiLink>
          )}
        </div>

        <div>
          <NotificationCenterList notifications={notificationsToShow} handleClose={handleClose} />
        </div>

        <div className={notificationCss.popoverFooter}>
          {canExpand && (
            <>
              <IconButton
                onClick={() => setShowAll((prev) => !prev)}
                disableRipple
                className={notificationCss.expandButton}
              >
                <UnreadBadge
                  invisible={showAll || unreadCount <= NOTIFICATION_CENTER_LIMIT}
                  anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <ExpandIcon color="border" />
                </UnreadBadge>
              </IconButton>
              <Typography sx={{ color: ({ palette }) => palette.border.main }}>
                {showAll ? 'Hide' : `${notifications.length - NOTIFICATION_CENTER_LIMIT} other notifications`}
              </Typography>
            </>
          )}

          {hasPushNotifications && (
            <Link href={{ pathname: AppRoutes.settings.notifications, query: router.query }} passHref legacyBehavior>
              <MuiLink className={notificationCss.settingsLink} variant="body2" onClick={onSettingsClick}>
                <SvgIcon component={SettingsIcon} inheritViewBox fontSize="small" /> Push notifications settings
              </MuiLink>
            </Link>
          )}
        </div>
      </Paper>
    </Popover>
  )
})

NotificationsPopover.displayName = 'NotificationsPopover'

export default NotificationsPopover
