import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
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
  decorators: [
    (Story, context) => {
      const isDark = (context.globals?.theme as string) === 'dark'
      return (
        <ShadcnProvider dark={isDark}>
          <Story />
        </ShadcnProvider>
      )
    },
  ],
  tags: ['autodocs'],
  argTypes: {
    walletAddress: {
      control: 'text',
      description: 'Wallet address to display (will be truncated)',
    },
    walletEns: {
      control: 'text',
      description: 'ENS name to display instead of truncated address',
    },
    isConnected: {
      control: 'boolean',
      description: 'Whether a wallet is connected',
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
    walletAddress: '0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6',
    isConnected: true,
    messages: 0,
    showSearch: false,
  },
}

/**
 * Header navigation with ENS name
 */
export const WithEns: Story = {
  args: {
    walletAddress: '0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6',
    walletEns: 'vitalik.eth',
    isConnected: true,
    messages: 0,
    showSearch: false,
  },
}

/**
 * Wallet not connected
 */
export const Disconnected: Story = {
  args: {
    walletAddress: '',
    isConnected: false,
    messages: 0,
    showSearch: false,
  },
}

/**
 * Header navigation with search button enabled
 */
export const WithSearch: Story = {
  args: {
    walletAddress: '0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6',
    isConnected: true,
    messages: 0,
    showSearch: true,
  },
}

/**
 * Header navigation with unread messages count badge
 */
export const WithNotifications: Story = {
  args: {
    walletAddress: '0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6',
    isConnected: true,
    messages: 3,
    showSearch: false,
  },
}

/**
 * Full configuration with search, notifications, and batch
 */
export const FullConfiguration: Story = {
  args: {
    walletAddress: '0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6',
    isConnected: true,
    messages: 5,
    showSearch: true,
    showBatch: true,
    batchCount: 7,
  },
}

/**
 * All variations side by side
 */
export const AllVariations: Story = {
  args: {
    walletAddress: '0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6',
    isConnected: true,
    messages: 0,
    showSearch: false,
  },
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          Disconnected
        </Typography>
        <HeaderNavigation walletAddress="" isConnected={false} />
      </div>

      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          Connected with address
        </Typography>
        <HeaderNavigation walletAddress="0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6" isConnected={true} messages={0} />
      </div>

      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          Connected with ENS
        </Typography>
        <HeaderNavigation
          walletAddress="0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6"
          walletEns="vitalik.eth"
          isConnected={true}
        />
      </div>

      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          With notification count
        </Typography>
        <HeaderNavigation walletAddress="0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6" isConnected={true} messages={12} />
      </div>

      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          With batch count
        </Typography>
        <HeaderNavigation
          walletAddress="0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6"
          isConnected={true}
          showBatch={true}
          batchCount={5}
        />
      </div>

      <div>
        <Typography variant="paragraph-small-medium" color="muted" className="mb-4">
          Full configuration
        </Typography>
        <HeaderNavigation
          walletAddress="0xA77D1f7F6bcD9bEcD3F9F6a8D95E2C1B4A3D98b6"
          isConnected={true}
          messages={99}
          showSearch={true}
          showBatch={true}
          batchCount={3}
        />
      </div>
    </div>
  ),
}
