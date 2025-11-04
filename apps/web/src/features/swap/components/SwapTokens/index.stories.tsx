import type { Meta, StoryObj } from '@storybook/react'
import SwapTokens from './index'
import { Paper } from '@mui/material'

const meta = {
  component: SwapTokens,
  parameters: {
    componentSubtitle: 'Renders a token swap between two tokens',
  },

  decorators: [
    (Story) => {
      return (
        <Paper sx={{ padding: 2 }}>
          <Story />
        </Paper>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SwapTokens>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    first: {
      value: '100',
      label: 'Sell',
      tokenInfo: {
        decimals: 18,
        logoUri:
          'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0x0625aFB445C3B6B7B929342a04A22599fd5dBB59.png',
        symbol: 'COW',
      },
    },
    second: {
      value: '86',
      label: 'For at least',
      tokenInfo: {
        decimals: 18,
        logoUri:
          'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984.png',
        symbol: 'UNI',
      },
    },
  },
}
