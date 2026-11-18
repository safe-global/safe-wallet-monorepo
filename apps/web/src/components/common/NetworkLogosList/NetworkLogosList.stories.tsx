import type { Meta, StoryObj } from '@storybook/react'
import NetworkLogosList from './index'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  title: 'Features/Multichain/NetworkLogosList',
  component: NetworkLogosList,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <div className="rounded-lg bg-card p-4">
          <Story />
        </div>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkLogosList>

export default meta
type Story = StoryObj<typeof meta>

export const SingleNetwork: Story = {
  args: {
    networks: [{ chainId: '1' }],
  },
}

export const TwoNetworks: Story = {
  args: {
    networks: [{ chainId: '1' }, { chainId: '137' }],
  },
}

export const FourNetworks: Story = {
  args: {
    networks: [{ chainId: '1' }, { chainId: '137' }, { chainId: '10' }, { chainId: '42161' }],
  },
}

export const ManyNetworksWithHasMore: Story = {
  args: {
    networks: [
      { chainId: '1' },
      { chainId: '137' },
      { chainId: '10' },
      { chainId: '42161' },
      { chainId: '8453' },
      { chainId: '100' },
    ],
    showHasMore: true,
  },
}

export const ManyNetworksWithoutHasMore: Story = {
  args: {
    networks: [{ chainId: '1' }, { chainId: '137' }, { chainId: '10' }, { chainId: '42161' }, { chainId: '8453' }],
    showHasMore: false,
  },
}

/**
 * The accounts-table badge configuration: 22px logos capped at 3 with a +N indicator, inside the
 * grey pill. Exercises the `--network-logo-size` mask geometry and the transparent +N indicator.
 */
export const InsideAccountBadgePill: Story = {
  args: {
    networks: [
      { chainId: '1' },
      { chainId: '137' },
      { chainId: '10' },
      { chainId: '42161' },
      { chainId: '8453' },
      { chainId: '100' },
    ],
    showHasMore: true,
    maxVisible: 3,
    imageSize: 22,
  },
  decorators: [
    (Story) => (
      <span
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '9999px',
          padding: '3px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Story />
      </span>
    ),
  ],
}
