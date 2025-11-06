import type { Meta, StoryObj } from '@storybook/react'
import TokenAmount from './index'
import { Paper } from '@mui/material'

const meta = {
  component: TokenAmount,
  parameters: {
    componentSubtitle: 'Renders a token Amount with Token Symbol and Logo',
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
} satisfies Meta<typeof TokenAmount>

export default meta
type Story = StoryObj<typeof meta>

export const WithTokenLogo: Story = {
  args: {
    value: '100',
    logoUri: 'https://safe-transaction-assets.staging.5afe.dev/chains/1/currency_logo.png',
    tokenSymbol: 'ETH',
  },
}

export const WithoutTokenLogo: Story = {
  args: {
    value: '100',
    tokenSymbol: 'ETH',
  },
}

export const LargeAmount: Story = {
  args: {
    value: '1000000.50',
    logoUri: 'https://safe-transaction-assets.staging.5afe.dev/chains/1/currency_logo.png',
    tokenSymbol: 'USDC',
  },
}

export const SmallAmount: Story = {
  args: {
    value: '0.000123',
    logoUri: 'https://safe-transaction-assets.staging.5afe.dev/chains/1/currency_logo.png',
    tokenSymbol: 'BTC',
  },
}
