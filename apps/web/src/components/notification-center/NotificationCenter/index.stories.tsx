import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { userEvent, within } from 'storybook/test'
import type { NotificationState } from '@/store/notificationsSlice'
import { createMockStory } from '@/stories/mocks'
import NotificationCenter from './index'

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
]

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
  store: {
    notifications,
  },
})

const meta = {
  title: 'Components/NotificationCenter/NotificationCenter',
  component: NotificationCenter,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof NotificationCenter>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bell = await canvas.findByLabelText('Notifications')
    await userEvent.click(bell)
  },
}
