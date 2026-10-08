import type { ReactElement, ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link, { type LinkProps } from 'next/link'

import { Popover, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Link as ShadcnLink } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import UnreadBadge from '@/components/common/UnreadBadge'
import notificationCss from '@/components/notification-center/NotificationCenter/styles.module.css'
import SettingsIcon from '@/public/images/sidebar/settings.svg'

export type NotificationsPopoverViewProps = {
  open: boolean
  anchorEl: HTMLButtonElement | null
  notificationCount: number
  unreadCount: number
  limit: number
  canExpand: boolean
  showAll: boolean
  list: ReactNode
  showPushSettings: boolean
  settingsHref: LinkProps['href']
  onToggleShowAll: () => void
  onClose: () => void
  onClear: () => void
  onSettingsClick: () => void
}

export const NotificationsPopoverView = ({
  open,
  anchorEl,
  notificationCount,
  unreadCount,
  limit,
  canExpand,
  showAll,
  list,
  showPushSettings,
  settingsHref,
  onToggleShowAll,
  onClose,
  onClear,
  onSettingsClick,
}: NotificationsPopoverViewProps): ReactElement => {
  const ExpandIcon = showAll ? ChevronUp : ChevronDown

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <PopoverContent
        showBackdrop
        anchor={anchorEl}
        side="bottom"
        align="start"
        sideOffset={12}
        className={cn('w-auto gap-0 p-0', notificationCss.popoverContainer)}
      >
        <div className={notificationCss.popoverHeader}>
          <div className="flex items-center">
            <Typography data-testid="notifications-title" variant="h4" className="font-bold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography variant="paragraph-mini" className={notificationCss.unreadCount}>
                {unreadCount}
              </Typography>
            )}
          </div>
          {notificationCount > 0 && (
            <ShadcnLink
              render={<button type="button" />}
              onClick={onClear}
              className={cn(notificationCss.actionLink, 'no-underline')}
            >
              Clear all
            </ShadcnLink>
          )}
        </div>

        <div>{list}</div>

        <div className={notificationCss.popoverFooter}>
          {canExpand && (
            <>
              <Button variant="ghost" size="icon-xs" onClick={onToggleShowAll} className={notificationCss.expandButton}>
                <UnreadBadge
                  invisible={showAll || unreadCount <= limit}
                  anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <ExpandIcon className="size-4 text-[var(--color-border-main)]" />
                </UnreadBadge>
              </Button>
              <Typography className="text-[var(--color-border-main)]">
                {showAll ? 'Hide' : `${notificationCount - limit} other notifications`}
              </Typography>
            </>
          )}

          {showPushSettings && (
            <Link href={settingsHref} passHref legacyBehavior>
              <ShadcnLink
                data-testid="notifications-button"
                className={notificationCss.settingsLink}
                onClick={onSettingsClick}
              >
                <SettingsIcon className="size-4" /> Push notifications settings
              </ShadcnLink>
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
