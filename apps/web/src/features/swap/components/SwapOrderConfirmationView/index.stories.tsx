import type { OrderStatuses } from '@safe-global/store/gateway/types'
import type { Meta, StoryObj } from '@storybook/react'
import CowOrderConfirmationView from './index'
import { swapOrderConfirmationViewBuilder } from '@/features/swap/helpers/swapOrderBuilder'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import { Interface } from 'ethers'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/types-kit'
import { Multi_send__factory } from '@safe-global/utils/types/contracts'

// Fixed settlement contract address for deterministic tests
const FIXED_SETTLEMENT_CONTRACT = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41'

// Fixed token data for deterministic snapshots
const FIXED_SELL_TOKEN = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  logoUri:
    'mock-assets/safe-transaction-assets.staging.5afe.dev/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.webp',
  name: 'USD Coin',
  symbol: 'USDC',
  trusted: true,
}

const Order = swapOrderConfirmationViewBuilder()
  .with({ kind: 'sell' })
  .with({ sellAmount: '10000000' })
  .with({ executedSellAmount: '10000000' })
  .with({ sellToken: FIXED_SELL_TOKEN })
  .with({ validUntil: 1735001680 }) // Fixed timestamp for deterministic tests (Dec 24, 2024)
  .with({ status: 'open' as OrderStatuses })

const meta = {
  title: 'Features/Swap/SwapOrderConfirmationView',
  component: CowOrderConfirmationView,

  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <RouterDecorator>
            <div className="bg-background rounded-lg p-4">
              <Story />
            </div>
          </RouterDecorator>
        </StoreDecorator>
      )
    },
  ],
  // Skip visual regression tests until baseline snapshots are generated
  tags: ['autodocs', '!test'],
} satisfies Meta<typeof CowOrderConfirmationView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    order: Order.build(),
    settlementContract: FIXED_SETTLEMENT_CONTRACT,
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5256-18562&mode=design&t=FlMhDhzNxpNKWuc1-4',
    },
  },
}

// Fixed receiver address for deterministic tests
const FIXED_RECEIVER = '0x1234567890123456789012345678901234567890'

export const CustomRecipient: Story = {
  args: {
    order: Order.with({ receiver: FIXED_RECEIVER }).build(),
    settlementContract: FIXED_SETTLEMENT_CONTRACT,
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5752-17758&mode=design&t=0Hnp94dhQMroAAnr-4',
    },
  },
}

const FIXED_MULTISEND = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'
const FIXED_ORDER_UID =
  '0x03a5d561ad2452d719a0d075573f4bed68217c696b52f151122c30e3e4426f1b05e6b5eb1d0e6aabab082057d5bb91f2ee6d11be66223d88'

const batchWithTransfer = encodeMultiSendData([
  { to: FIXED_RECEIVER, value: '500000000000000', data: '0x', operation: OperationType.Call },
  {
    to: FIXED_SETTLEMENT_CONTRACT,
    value: '0',
    data: new Interface(['function setPreSignature(bytes,bool)']).encodeFunctionData('setPreSignature', [
      FIXED_ORDER_UID,
      true,
    ]),
    operation: OperationType.Call,
  },
])

export const BatchedWithOtherActions: Story = {
  args: {
    order: Order.build(),
    settlementContract: FIXED_MULTISEND,
    txData: {
      to: { value: FIXED_MULTISEND },
      value: '0',
      hexData: Multi_send__factory.createInterface().encodeFunctionData('multiSend', [batchWithTransfer]),
      dataDecoded: null,
      operation: OperationType.DelegateCall,
      trustedDelegateCallTarget: true,
      addressInfoIndex: null,
      tokenInfoIndex: null,
    },
  },
}
