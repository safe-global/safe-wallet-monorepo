import type { Meta, StoryObj } from '@storybook/nextjs'
import { TwapOrder as TwapOrderComponent } from './index'
import { Paper } from '@mui/material'
import { appDataBuilder, orderTokenBuilder, twapOrderBuilder } from '@/features/swap/helpers/swapOrderBuilder'
import { StoreDecorator } from '@/stories/storeDecorator'

const FullfilledTwapOrder = twapOrderBuilder()
  .with({ status: 'fulfilled' })
  .with({ kind: 'sell' })
  .with({ class: 'limit' })
  .with({ sellAmount: '10000000000000000' })
  .with({ executedSellAmount: '10000000000000000' })
  .with({ buyAmount: '3388586928324482608' })
  .with({ executedBuyAmount: '3388586928324482608' })
  .with({ validUntil: 1713520008 })
  .with({
    sellToken: {
      ...orderTokenBuilder().build(),
      logoUri:
        'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14.png',
    },
  })
  .with({
    buyToken: {
      ...orderTokenBuilder().build(),
      logoUri:
        'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xbe72E441BF55620febc26715db68d3494213D8Cb.png',
    },
  })
  .with({ numberOfParts: '2' })

  .with({ partSellAmount: '5000000000000000' })
  .with({ minPartLimit: '1694293464162241304' })
  .with({ timeBetweenParts: 1800 })
  .with({
    fullAppData: appDataBuilder('twap').build(),
  })

const meta = {
  component: TwapOrderComponent,
  parameters: {
    componentSubtitle: 'Renders a Status label with icon and text for a swap order',
  },

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
  // excludeStories: ['SwapOrderProps'],
} satisfies Meta<typeof TwapOrderComponent>

export default meta
type Story = StoryObj<typeof meta>

export const ExecutedTwap: Story = {
  args: {
    order: FullfilledTwapOrder.build(),
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/VyA38zUPbJ2zflzCIYR6Nu/Swap?node-id=6655-24390&t=pg5ZPJArWFJOiEsn-4',
    },
  },
}
