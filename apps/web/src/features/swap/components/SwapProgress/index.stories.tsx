import { orderTokenBuilder, swapOrderBuilder } from '@/features/swap/helpers/swapOrderBuilder'
import type { Meta, StoryObj } from '@storybook/react'
import SwapProgress from './index'
import { Paper } from '@mui/material'

const meta = {
  component: SwapProgress,
  parameters: {
    componentSubtitle: 'Renders a linear progress bar with % of a token sold',
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
} satisfies Meta<typeof SwapProgress>

export default meta
type Story = StoryObj<typeof meta>

export const Filled: Story = {
  args: {
    order: swapOrderBuilder()
      .with({ kind: 'sell' })
      .with({ sellAmount: '10000000' })
      .with({ executedSellAmount: '10000000' })
      .with({ sellToken: { ...orderTokenBuilder().build(), decimals: 6 } })
      .build(),
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?node-id=5974%3A14487&mode=dev',
    },
  },
}

export const PartiallyFilled: Story = {
  args: {
    order: swapOrderBuilder()
      .with({ kind: 'sell' })
      .with({ sellAmount: '5000000' })
      .with({ executedSellAmount: '1000000' })
      .with({ sellToken: { ...orderTokenBuilder().build(), decimals: 6 } })
      .build(),
  },
}

export const NotFilled: Story = {
  args: {
    order: swapOrderBuilder()
      .with({ kind: 'sell' })
      .with({ sellAmount: '5000000' })
      .with({ executedSellAmount: '0' })
      .with({ sellToken: { ...orderTokenBuilder().build(), decimals: 6 } })
      .build(),
  },
}
