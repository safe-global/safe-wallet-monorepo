import type { Meta, StoryObj } from '@storybook/react'
import OrderId from './index'
import { Paper } from '@mui/material'

const meta = {
  component: OrderId,
  parameters: {
    componentSubtitle: 'Renders an order id with an external link and a copy button',
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
} satisfies Meta<typeof OrderId>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    orderId:
      '0x1282e32a3a69aeb5a65fcdec0ae40fe16b398d54609bc9a3c8be3eb57d1a0fd07a9af6ef9197041a5841e84cb27873bebd3486e2661510ab',
    href: 'https://explorer.cow.fi/orders/0x1282e32a3a69aeb5a65fcdec0ae40fe16b398d54609bc9a3c8be3eb57d1a0fd07a9af6ef9197041a5841e84cb27873bebd3486e2661510ab',
  },
}
