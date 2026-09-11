import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import type { Notification } from '@/store/notificationsSlice'
import Notifications from './index'

// autoHideDuration: null keeps info/success toasts open so stories and visual tests are stable
const createNotification = (notification: Partial<Notification> & Pick<Notification, 'id'>): Notification => ({
  message: '',
  variant: 'info',
  groupKey: notification.id,
  timestamp: 1700000000000,
  autoHideDuration: null,
  ...notification,
})

const withNotifications = (notifications: Notification[]): Decorator =>
  function WithNotifications(Story) {
    return (
      <StoreDecorator initialState={{ notifications }}>
        <div className="min-h-[480px]">
          <Story />
        </div>
      </StoreDecorator>
    )
  }

const meta = {
  title: 'Components/Common/Notifications',
  component: Notifications,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Notifications>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    withNotifications([
      createNotification({
        id: 'default',
        variant: 'success',
        title: 'Transaction executed',
        message: 'Your transaction was successfully executed.',
      }),
    ]),
  ],
}

export const AllVariants: Story = {
  decorators: [
    withNotifications([
      createNotification({
        id: 'success',
        variant: 'success',
        title: 'Transaction executed',
        message: 'Your transaction was successfully executed.',
      }),
      createNotification({
        id: 'info',
        variant: 'info',
        title: 'Transaction confirmed',
        message: 'It requires more confirmations before it can be executed.',
      }),
      createNotification({
        id: 'warning',
        variant: 'warning',
        title: 'Nonce out of order',
        message: 'There are transactions with lower nonces waiting to be executed first.',
      }),
      createNotification({
        id: 'error',
        variant: 'error',
        title: 'Transaction failed',
        message: 'The transaction was reverted by the contract.',
      }),
    ]),
  ],
}

export const WithLink: Story = {
  decorators: [
    withNotifications([
      createNotification({
        id: 'with-link',
        variant: 'info',
        title: 'Safe upgrade available',
        message: 'A new version of the Safe contract is available.',
        link: { href: '/settings/setup', title: 'Go to settings' },
      }),
    ]),
  ],
}

export const WithDetailedMessage: Story = {
  decorators: [
    withNotifications([
      createNotification({
        id: 'with-details',
        variant: 'error',
        title: 'Transaction failed',
        message: 'The transaction could not be broadcast.',
        detailedMessage:
          'Error: cannot estimate gas; transaction may fail or may require manual gas limit\n(reason="execution reverted: GS026", method="estimateGas")',
      }),
    ]),
  ],
}

export const WithoutTitle: Story = {
  decorators: [
    withNotifications([
      createNotification({
        id: 'no-title',
        variant: 'success',
        message: 'Address copied to clipboard',
      }),
    ]),
  ],
}
