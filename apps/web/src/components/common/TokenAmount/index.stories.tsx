import type { Meta, StoryObj } from '@storybook/react'
import TokenAmount from './index'

const meta = {
  title: 'Components/Common/TokenAmount',
  component: TokenAmount,
  parameters: {
    componentSubtitle: 'Renders a token Amount with Token Symbol and Logo',
  },

  decorators: [
    (Story) => {
      return (
        <div className="rounded-lg bg-card p-4">
          <Story />
        </div>
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
