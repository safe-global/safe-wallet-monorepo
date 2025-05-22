import { useState, useMemo, type ReactElement, type MouseEvent } from 'react'
import ButtonBase from '@mui/material/ButtonBase'
import Popover from '@mui/material/Popover'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MuiLink from '@mui/material/Link'
import BellIcon from '@/public/images/common/notifications.svg'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  selectNotifications,
  readNotification,
  closeNotification,
  deleteAllNotifications,
} from '@/store/notificationsSlice'
import NotificationCenterList from '@/components/notification-center/NotificationCenterList'
import UnreadBadge from '@/components/common/UnreadBadge'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import SettingsIcon from '@/public/images/sidebar/settings.svg'

import css from './styles.module.css'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import SvgIcon from '@mui/icons-material/ExpandLess'
import { useHasFeature } from '@/hooks/useChains'
import { useShowNotificationsRenewalMessage } from '@/components/settings/PushNotifications/hooks/useShowNotificationsRenewalMessage'
import { FEATURES } from '@safe-global/utils/utils/chains'

const NOTIFICATION_CENTER_LIMIT = 4

const NotificationCenter = (): ReactElement => {
  const router = useRouter()
  const [showAll, setShowAll] = useState<boolean>(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)
  const hasPushNotifications = useHasFeature(FEATURES.PUSH_NOTIFICATIONS)
  const dispatch = useAppDispatch()

  // This hook is used to show the notification renewal message when the app is opened
  useShowNotificationsRenewalMessage()

  const notifications = useAppSelector(selectNotifications)
  const chronologicalNotifications = useMemo(() => {
    // Clone as Redux returns read-only array
    return notifications.slice().sort((a, b) => b.timestamp - a.timestamp)
  }, [notifications])

  const canExpand = notifications.length > NOTIFICATION_CENTER_LIMIT + 1

  const notificationsToShow =
    showAll || !canExpand ? chronologicalNotifications : chronologicalNotifications.slice(0, NOTIFICATION_CENTER_LIMIT)

  const unreadCount = useMemo(() => notifications.filter(({ isRead }) => !isRead).length, [notifications])
  const hasUnread = unreadCount > 0

  const handleRead = () => {
    notificationsToShow.forEach(({ isRead, id }) => {
      if (!isRead) {
        dispatch(readNotification({ id }))
      }
    })
    setShowAll(false)
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!open) {
      trackEvent(OVERVIEW_EVENTS.NOTIFICATION_CENTER)

      notifications.forEach(({ isDismissed, id }) => {
        if (!isDismissed) {
          dispatch(closeNotification({ id }))
        }
      })
    } else {
      handleRead()
    }
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    if (open) {
      handleRead()
      setShowAll(false)
    }
    setAnchorEl(null)
  }

  const handleClear = () => {
    dispatch(deleteAllNotifications())
  }

  const onSettingsClick = () => {
    setTimeout(handleClose, 300)
  }

  const ExpandIcon = showAll ? ExpandLessIcon : ExpandMoreIcon

  return (
    <>
      <ButtonBase className={css.bell} onClick={handleClick}>
        <UnreadBadge
          invisible={!hasUnread}
          count={unreadCount}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <SvgIcon component={BellIcon} inheritViewBox fontSize="medium" />
        </UnreadBadge>
      </ButtonBase>

      <Popover
        // Clicking the "view transaction" link doesn't remove the popover even though
        // handleClose is called which results in the UI not being clickable anymore
        // so by adding a key we force a re-render
        key={Number(open)}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& > .MuiPaper-root': {
            top: 'var(--header-height) !important',
          },
        }}
        transitionDuration={0}
      >
        <Paper className={css.popoverContainer}>
          <div className={css.popoverHeader}>
            <div>
              <Typography data-testid="notifications-title" variant="h4" component="span" fontWeight={700}>
                Notifications
              </Typography>
              {hasUnread && (
                <Typography variant="caption" className={css.unreadCount}>
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

          <div className={css.popoverFooter}>
            {canExpand && (
              <>
                <IconButton onClick={() => setShowAll((prev) => !prev)} disableRipple className={css.expandButton}>
                  <UnreadBadge
                    invisible={showAll || unreadCount <= NOTIFICATION_CENTER_LIMIT}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
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
              <Link
                href={{
                  pathname: AppRoutes.settings.notifications,
                  query: router.query,
                }}
                passHref
                legacyBehavior
              >
                <MuiLink
                  data-testid="notifications-button"
                  className={css.settingsLink}
                  variant="body2"
                  onClick={onSettingsClick}
                >
                  <SvgIcon component={SettingsIcon} inheritViewBox fontSize="small" /> Push notifications settings
                </MuiLink>
              </Link>
            )}
          </div>
        </Paper>
      </Popover>
    </>
  )
}

export default NotificationCenter
