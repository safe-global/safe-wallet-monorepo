import type { OrderStatuses } from '@safe-global/store/gateway/types'
import type { Meta, StoryObj } from '@storybook/nextjs'
import CowOrderConfirmationView from './index'
import { Paper } from '@mui/material'
import { orderTokenBuilder, swapOrderConfirmationViewBuilder } from '@/features/swap/helpers/swapOrderBuilder'
import { faker } from '@faker-js/faker'
import { StoreDecorator } from '@/stories/storeDecorator'

const Order = swapOrderConfirmationViewBuilder()
  .with({ kind: 'sell' })
  .with({ sellAmount: '10000000' })
  .with({ executedSellAmount: '10000000' })
  .with({ sellToken: { ...orderTokenBuilder().build(), decimals: 6 } })
  .with({ validUntil: new Date().getTime() / 1000 + 28 * 60 })
  .with({ status: 'open' as OrderStatuses })

const meta = {
  component: CowOrderConfirmationView,

  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <Paper sx={{ padding: 2 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof CowOrderConfirmationView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    order: Order.build(),
    settlementContract: faker.finance.ethereumAddress(),
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5256-18562&mode=design&t=FlMhDhzNxpNKWuc1-4',
    },
  },
}

export const CustomRecipient: Story = {
  args: {
    order: Order.with({ receiver: faker.finance.ethereumAddress() }).build(),
    settlementContract: faker.finance.ethereumAddress(),
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5752-17758&mode=design&t=0Hnp94dhQMroAAnr-4',
    },
  },
}
