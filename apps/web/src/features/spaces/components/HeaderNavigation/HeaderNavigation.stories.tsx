import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Typography } from '@/components/ui/typography'
import { HeaderNavigation } from './HeaderNavigation'

/**
 * HeaderNavigation Component Stories
 * HeaderNavigation displays navigation actions with icons for search, notifications, and wallet address.
 * The notifications icon can display a badge when there are unread messages.
 */
const meta = {
  title: 'Features/Spaces/HeaderNavigation',
  component: HeaderNavigation,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    walletAddress: {
      control: 'text',
      description: 'Safe address to display (will be truncated)',
    },
    messages: {
      control: 'number',
      description: 'Number of unread messages',
    },
    showSearch: {
      control: 'boolean',
      description: 'Whether to show the search button',
    },
    onSearchClick: {
      action: 'search-clicked',
      description: 'Callback when search button is clicked',
    },
    onNotificationsClick: {
      action: 'notifications-clicked',
      description: 'Callback when notifications button is clicked',
    },
    onWalletClick: {
      action: 'wallet-clicked',
      description: 'Callback when wallet button is clicked',
    },
  },
  args: {
    onSearchClick: fn(),
    onNotificationsClick: fn(),
    onWalletClick: fn(),
  },
} satisfies Meta<typeof HeaderNavigation>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default header navigation without search button
 */
export const Default: Story = {
  args: {
    walletAddress: '0xA77D...98b6',
    messages: 0,
    showSearch: false,
  },
}

/**
 * Header navigation with search button enabled
 */
export const WithSearch: Story = {
  args: {
    walletAddress: '0xA77D...98b6',
    messages: 0,
    showSearch: true,
  },
}

/**
 * Header navigation with unread messages badge
 */
export const WithNotifications: Story = {
  args: {
    walletAddress: '0xA77D...98b6',
    messages: 3,
    showSearch: false,
  },
}

/**
 * Full configuration with search and notifications
 */
export const FullConfiguration: Story = {
  args: {
    walletAddress: '0xA77D...98b6',
    messages: 5,
    showSearch: true,
  },
}

/**
 * Long address example
 */
export const LongAddress: Story = {
  args: {
    walletAddress: '0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6',
    messages: 1,
    showSearch: true,
  },
}

/**
 * All variations side by side
 */
export const AllVariations: Story = {
  args: {
    walletAddress: '0xA77D...98b6',
    messages: 0,
    showSearch: false,
  },
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          Without Search
        </Typography>
        <HeaderNavigation walletAddress="0xA77D...98b6" messages={0} showSearch={false} />
      </div>

      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          With Search
        </Typography>
        <HeaderNavigation walletAddress="0xA77D...98b6" messages={0} showSearch={true} />
      </div>

      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          With Notifications Badge
        </Typography>
        <HeaderNavigation walletAddress="0xA77D...98b6" messages={3} showSearch={false} />
      </div>

      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          Full Configuration
        </Typography>
        <HeaderNavigation walletAddress="0xA77D...98b6" messages={5} showSearch={true} />
      </div>
    </div>
  ),
}
