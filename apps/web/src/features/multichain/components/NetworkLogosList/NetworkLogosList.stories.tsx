import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import NetworkLogosList from './index'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  component: NetworkLogosList,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <Paper sx={{ padding: 2 }}>
          <Story />
        </Paper>
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
