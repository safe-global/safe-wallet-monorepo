import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import NetworkLogosPill from './index'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  component: NetworkLogosPill,
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
} satisfies Meta<typeof NetworkLogosPill>

export default meta
type Story = StoryObj<typeof meta>

export const FewNetworks: Story = {
  args: {
    networks: [{ chainId: '1' }, { chainId: '137' }],
  },
}

/** More chains than fit: three logos plus the transparent "+N" indicator. */
export const WithOverflow: Story = {
  args: {
    networks: [
      { chainId: '1' },
      { chainId: '137' },
      { chainId: '10' },
      { chainId: '42161' },
      { chainId: '8453' },
      { chainId: '100' },
    ],
  },
}
