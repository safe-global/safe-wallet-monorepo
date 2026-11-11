import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { NotificationState } from '@/store/notificationsSlice'
import { createMockStory } from '@/stories/mocks'
import NotificationCenterList from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
})

const now = Date.now()

const notifications: NotificationState = [
  {
    id: '1',
    title: 'Transaction executed',
    message: 'Your transaction was successfully executed.',
    groupKey: 'tx-executed',
    variant: 'success',
    timestamp: now - 5 * 60_000,
    isRead: false,
    isDismissed: true,
    link: { href: '/transactions/history', title: 'View transaction' },
  },
  {
    id: '2',
    title: 'Confirmation required',
    message: 'A transaction in the queue requires your confirmation.',
    groupKey: 'tx-confirmation',
    variant: 'warning',
    timestamp: now - 60 * 60_000,
    isRead: false,
    isDismissed: true,
    link: { href: '/transactions/queue', title: 'View queue' },
  },
  {
    id: '3',
    message: 'Safe Apps are now available for your network.',
    groupKey: 'safe-apps',
    variant: 'info',
    timestamp: now - 24 * 60 * 60_000,
    isRead: true,
    isDismissed: true,
  },
  {
    id: '4',
    title: 'Transaction failed',
    message: 'Your transaction could not be executed.',
    groupKey: 'tx-failed',
    variant: 'error',
    timestamp: now - 2 * 24 * 60 * 60_000,
    isRead: true,
    isDismissed: true,
  },
]

const meta = {
  title: 'Components/NotificationCenter/NotificationCenterList',
  component: NotificationCenterList,
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-lg border border-border bg-card">
        <Story />
      </div>
    ),
    setup.decorator,
  ],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
  args: {
    handleClose: () => {},
  },
} satisfies Meta<typeof NotificationCenterList>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    notifications,
  },
}

export const Empty: Story = {
  args: {
    notifications: [],
  },
}
