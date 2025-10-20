import type { OrderStatuses } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Meta, StoryObj } from '@storybook/react'
import { SellOrder as SellOrderComponent } from './index'
import { Paper } from '@mui/material'
import { appDataBuilder, orderTokenBuilder, swapOrderBuilder } from '@/features/swap/helpers/swapOrderBuilder'
import { StoreDecorator } from '@/stories/storeDecorator'

const FulfilledSwapOrder = swapOrderBuilder()
  .with({
    uid: '0x03a5d561ad2452d719a0d075573f4bed68217c696b52f151122c30e3e4426f1b05e6b5eb1d0e6aabab082057d5bb91f2ee6d11be66223d88',
  })
  .with({ status: 'fulfilled' })
  .with({ kind: 'sell' })
  .with({ orderClass: 'limit' })
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
  .with({
    explorerUrl:
      'https://explorer.cow.fi/orders/0x03a5d561ad2452d719a0d075573f4bed68217c696b52f151122c30e3e4426f1b05e6b5eb1d0e6aabab082057d5bb91f2ee6d11be66223d88',
  })
  .with({
    fullAppData: appDataBuilder('market').build(),
  })

const NonFulfilledSwapOrder = {
  ...FulfilledSwapOrder.build(),
  status: 'open' as OrderStatuses,
  expiresTimestamp: new Date().getTime() / 1000 + 28 * 60,
  executedSellAmount: '0',
}

const meta = {
  component: SellOrderComponent,
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
} satisfies Meta<typeof SellOrderComponent>

export default meta
type Story = StoryObj<typeof meta>

export const ExecutedMarket: Story = {
  args: {
    order: FulfilledSwapOrder.build(),
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37759&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}
export const ExecutedLimit: Story = {
  args: {
    order: FulfilledSwapOrder.with({ fullAppData: appDataBuilder('limit').build() }).build(),
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37759&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}

export const PendingMarket: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
      fullAppData: appDataBuilder('market').build(),
      status: 'presignaturePending' as OrderStatuses,
      validUntil: new Date().getTime() / 1000 + 28 * 60,
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5974-14391&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}

export const PendingLimit: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
      fullAppData: appDataBuilder('limit').build(),
      status: 'presignaturePending' as OrderStatuses,
      validUntil: new Date().getTime() / 1000 + 28 * 60,
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5974-14391&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}

export const OpenMarket: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37808&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}
export const OpenLimit: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
      fullAppData: appDataBuilder('limit').build(),
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37808&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}
export const CancelledMarket: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
      fullAppData: appDataBuilder('market').build(),
      status: 'cancelled' as OrderStatuses,
      validUntil: new Date().getTime() / 1000 - 28 * 60,
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37924&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}

export const CancelledLimit: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
      fullAppData: appDataBuilder('limit').build(),
      status: 'cancelled' as OrderStatuses,
      validUntil: new Date().getTime() / 1000 - 28 * 60,
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37924&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}

export const ExpiredSwap: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
      fullAppData: appDataBuilder('market').build(),
      status: 'expired' as OrderStatuses,
      validUntil: new Date().getTime() / 1000 - 28 * 60,
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37987&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}

export const ExpiredLimit: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
      fullAppData: appDataBuilder('limit').build(),
      status: 'expired' as OrderStatuses,
      validUntil: new Date().getTime() / 1000 - 28 * 60,
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37987&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}

export const LimitOpenPartiallyFilled: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
      fullAppData: appDataBuilder('limit').build(),
      status: 'open' as OrderStatuses,
      validUntil: new Date().getTime() / 1000 + 28 * 60,
      executedSellAmount: '1000000000000000',
      executedBuyAmount: '3388586928324',
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37987&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}

export const LimitExpiredPartiallyFilled: Story = {
  args: {
    order: {
      ...NonFulfilledSwapOrder,
      fullAppData: appDataBuilder('limit').build(),
      status: 'expired' as OrderStatuses,
      validUntil: new Date().getTime() / 1000 - 28 * 60,
      executedSellAmount: '1000000000000000',
      executedBuyAmount: '3388586928324',
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37987&mode=design&t=cJDGDQGZFqccSTaB-4',
    },
  },
}
