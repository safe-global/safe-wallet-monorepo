import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Box, Paper, Typography, IconButton, Badge, Popover, Button, Divider } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoIcon from '@mui/icons-material/Info'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'

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
      return <CheckCircleIcon color="success" fontSize="small" />
    case 'info':
      return <InfoIcon color="info" fontSize="small" />
    case 'warning':
      return <WarningIcon color="warning" fontSize="small" />
    case 'error':
      return <ErrorIcon color="error" fontSize="small" />
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
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: 360, maxHeight: 400, overflow: 'auto' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" color="primary">
                Mark all read
              </Button>
            )}
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  p: 2,
                  display: 'flex',
                  gap: 2,
                  bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                  borderBottom: 1,
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                {getVariantIcon(notification.variant)}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{notification.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(notification.timestamp)}
                  </Typography>
                  {notification.link && (
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, cursor: 'pointer' }}>
                      {notification.link.title}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Popover>
    </>
  )
}

// Stories

export const Default: StoryObj = {
  render: () => (
    <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        Click the bell icon to open notifications
      </Typography>
      <MockNotificationBell notifications={mockNotifications} />
    </Box>
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
    <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        No notifications
      </Typography>
      <MockNotificationBell notifications={[]} />
    </Box>
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
    <Paper sx={{ width: 400, maxHeight: 500, overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Notifications</Typography>
      </Box>
      {mockNotifications.map((notification) => (
        <Box
          key={notification.id}
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            bgcolor: notification.isRead ? 'transparent' : 'action.hover',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {getVariantIcon(notification.variant)}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2">{notification.message}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(notification.timestamp)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Paper>
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
    <Paper sx={{ width: 400, p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Success Notification
      </Typography>
      <Box sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 1, p: 2, display: 'flex', gap: 2 }}>
        <CheckCircleIcon color="success" />
        <Box>
          <Typography variant="body2">Transaction confirmed</Typography>
          <Typography variant="caption" color="text.secondary">
            1m ago
          </Typography>
        </Box>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Info Notification
      </Typography>
      <Box sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 1, p: 2, display: 'flex', gap: 2 }}>
        <InfoIcon color="info" />
        <Box>
          <Typography variant="body2">New transaction requires your signature</Typography>
          <Typography variant="caption" color="text.secondary">
            5m ago
          </Typography>
        </Box>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Warning Notification
      </Typography>
      <Box sx={{ mb: 2, border: 1, borderColor: 'divider', borderRadius: 1, p: 2, display: 'flex', gap: 2 }}>
        <WarningIcon color="warning" />
        <Box>
          <Typography variant="body2">Gas prices are high</Typography>
          <Typography variant="caption" color="text.secondary">
            10m ago
          </Typography>
        </Box>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Error Notification
      </Typography>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, display: 'flex', gap: 2 }}>
        <ErrorIcon color="error" />
        <Box>
          <Typography variant="body2">Transaction failed</Typography>
          <Typography variant="caption" color="text.secondary">
            1h ago
          </Typography>
        </Box>
      </Box>
    </Paper>
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
      <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          With many notifications (3 unread)
        </Typography>
        <MockNotificationBell notifications={manyNotifications} />
      </Box>
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
