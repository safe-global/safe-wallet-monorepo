import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Bell, CircleCheck, Info, TriangleAlert, OctagonX } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils/cn'

/**
 * NotificationCenter components handle in-app notifications for transaction
 * status updates, security alerts, and other important events.
 *
 * The center includes a bell icon with badge, expandable list, and
 * individual notification items with timestamps and actions.
 *
 * Note: Actual components require Redux store context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Components/NotificationCenter',
  parameters: {
    layout: 'centered',
  },
}

export default meta

// Mock notification type
interface MockNotification {
  id: string
  timestamp: number
  isRead: boolean
  message: string
  variant: 'success' | 'info' | 'warning' | 'error'
  link?: { href: string; title: string }
}

const mockNotifications: MockNotification[] = [
  {
    id: '1',
    timestamp: Date.now() - 60000,
    isRead: false,
    message: 'Transaction confirmed',
    variant: 'success',
    link: { href: '/transactions/tx?id=0x123', title: 'View transaction' },
  },
  {
    id: '2',
    timestamp: Date.now() - 300000,
    isRead: false,
    message: 'New transaction requires your signature',
    variant: 'info',
    link: { href: '/transactions/queue', title: 'View queue' },
  },
  {
    id: '3',
    timestamp: Date.now() - 3600000,
    isRead: true,
    message: 'Safe created successfully',
    variant: 'success',
  },
  {
    id: '4',
    timestamp: Date.now() - 86400000,
    isRead: true,
    message: 'Owner added to your Safe',
    variant: 'info',
  },
]

const getVariantIcon = (variant: MockNotification['variant']) => {
  switch (variant) {
    case 'success':
      return <CircleCheck className="size-4 text-success" />
    case 'info':
      return <Info className="size-4 text-info" />
    case 'warning':
      return <TriangleAlert className="size-4 text-warning" />
    case 'error':
      return <OctagonX className="size-4 text-destructive" />
  }
}

const formatTimestamp = (timestamp: number) => {
  const diff = Date.now() - timestamp
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

// Mock NotificationCenter Bell
const MockNotificationBell = ({ notifications }: { notifications: MockNotification[] }) => {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive">
                <Typography variant="paragraph-mini-bold" className="text-destructive-foreground">
                  {unreadCount}
                </Typography>
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-90 p-0">
        <div className="max-h-100 overflow-auto">
          <div className="flex items-center justify-between p-4">
            <Typography variant="h4">Notifications</Typography>
            {unreadCount > 0 && (
              <Button variant="link" size="sm">
                Mark all read
              </Button>
            )}
          </div>
          <Separator />
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Typography variant="paragraph-small" color="muted">
                No notifications
              </Typography>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex cursor-pointer gap-4 border-b border-border p-4 hover:bg-accent',
                  !notification.isRead && 'bg-muted',
                )}
              >
                {getVariantIcon(notification.variant)}
                <div className="flex-1">
                  <Typography variant="paragraph-small">{notification.message}</Typography>
                  <Typography variant="paragraph-mini" color="muted" as="span" className="block">
                    {formatTimestamp(notification.timestamp)}
                  </Typography>
                  {notification.link && (
                    <Typography variant="paragraph-mini" as="span" className="mt-1 block cursor-pointer text-primary">
                      {notification.link.title}
                    </Typography>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Stories

export const Default: StoryObj = {
  render: () => (
    <div className="rounded-lg bg-card p-8">
      <Typography variant="paragraph-mini" color="muted" as="div" className="mb-4">
        Click the bell icon to open notifications
      </Typography>
      <MockNotificationBell notifications={mockNotifications} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The NotificationCenter bell icon shows unread count and opens a popover with notifications.',
      },
    },
  },
}

export const Empty: StoryObj = {
  render: () => (
    <div className="rounded-lg bg-card p-8">
      <Typography variant="paragraph-mini" color="muted" as="div" className="mb-4">
        No notifications
      </Typography>
      <MockNotificationBell notifications={[]} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'NotificationCenter with no notifications shows empty bell icon.',
      },
    },
  },
}

export const NotificationList: StoryObj = {
  render: () => (
    <div className="max-h-125 w-100 overflow-auto rounded-lg bg-card">
      <div className="border-b border-border p-4">
        <Typography variant="h4">Notifications</Typography>
      </div>
      {mockNotifications.map((notification) => (
        <div
          key={notification.id}
          className={cn('flex gap-4 border-b border-border p-4', !notification.isRead && 'bg-muted')}
        >
          {getVariantIcon(notification.variant)}
          <div className="flex-1">
            <Typography variant="paragraph-small">{notification.message}</Typography>
            <Typography variant="paragraph-mini" color="muted" as="span" className="block">
              {formatTimestamp(notification.timestamp)}
            </Typography>
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'NotificationCenterList displays a list of notification items.',
      },
    },
  },
}

export const NotificationItems: StoryObj = {
  render: () => (
    <div className="w-100 rounded-lg bg-card p-4">
      <Typography variant="paragraph-small-bold" as="div" className="mb-1">
        Success notification
      </Typography>
      <div className="mb-4 flex gap-4 rounded-lg border border-border p-4">
        <CircleCheck className="size-4 text-success" />
        <div>
          <Typography variant="paragraph-small">Transaction confirmed</Typography>
          <Typography variant="paragraph-mini" color="muted" as="span" className="block">
            1m ago
          </Typography>
        </div>
      </div>

      <Typography variant="paragraph-small-bold" as="div" className="mb-1">
        Info notification
      </Typography>
      <div className="mb-4 flex gap-4 rounded-lg border border-border p-4">
        <Info className="size-4 text-info" />
        <div>
          <Typography variant="paragraph-small">New transaction requires your signature</Typography>
          <Typography variant="paragraph-mini" color="muted" as="span" className="block">
            5m ago
          </Typography>
        </div>
      </div>

      <Typography variant="paragraph-small-bold" as="div" className="mb-1">
        Warning notification
      </Typography>
      <div className="mb-4 flex gap-4 rounded-lg border border-border p-4">
        <TriangleAlert className="size-4 text-warning" />
        <div>
          <Typography variant="paragraph-small">Gas prices are high</Typography>
          <Typography variant="paragraph-mini" color="muted" as="span" className="block">
            10m ago
          </Typography>
        </div>
      </div>

      <Typography variant="paragraph-small-bold" as="div" className="mb-1">
        Error notification
      </Typography>
      <div className="flex gap-4 rounded-lg border border-border p-4">
        <OctagonX className="size-4 text-destructive" />
        <div>
          <Typography variant="paragraph-small">Transaction failed</Typography>
          <Typography variant="paragraph-mini" color="muted" as="span" className="block">
            1h ago
          </Typography>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Individual NotificationCenterItem components with different variants.',
      },
    },
  },
}

export const ManyNotifications: StoryObj = {
  render: () => {
    const manyNotifications: MockNotification[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      timestamp: Date.now() - i * 3600000,
      isRead: i > 2,
      message: `Notification message ${i + 1}`,
      variant: (['success', 'info', 'warning', 'error'] as const)[i % 4],
    }))

    return (
      <div className="rounded-lg bg-card p-8">
        <Typography variant="paragraph-mini" color="muted" as="div" className="mb-4">
          With many notifications (3 unread)
        </Typography>
        <MockNotificationBell notifications={manyNotifications} />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'NotificationCenter with many notifications shows scrollable list.',
      },
    },
  },
}
