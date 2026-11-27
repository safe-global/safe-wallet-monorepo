import type { Meta, StoryObj } from '@storybook/react'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import { StoreDecorator } from '@/stories/storeDecorator'
import { SpendingLimitBatchSummary } from './SpendingLimitBatchSummary'

const SPENDER = '0xEfC188BFc4FFFaAb53Fde6EF0FcFA4eC9cfCC9D9'
const TOKEN = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

const txData: TransactionData = {
  to: { value: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2' },
  operation: Operation.DELEGATE,
  tokenInfoIndex: {
    [TOKEN]: { address: TOKEN, decimals: 6, symbol: 'USDC', name: 'USD Coin', logoUri: '', type: 'ERC20' },
  },
}

const allowance = (method: string, values: string[]) => ({
  method,
  parameters: values.map((value) => ({ name: '', type: 'address', value })),
})

const meta = {
  title: 'Components/Transactions/TxDetails/SpendingLimitBatchSummary',
  component: SpendingLimitBatchSummary,
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <div className="p-4">
          <Story />
        </div>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SpendingLimitBatchSummary>

export default meta
type Story = StoryObj<typeof meta>

export const NewPolicy: Story = {
  args: {
    txData,
    batch: {
      enablesModule: true,
      changes: [
        {
          method: 'setAllowance',
          dataDecoded: allowance('setAllowance', [SPENDER, TOKEN, '1500000000', '1440', '0']),
          resetsSpent: false,
        },
      ],
      removedSpenders: [],
    },
  },
}

export const EditedPolicy: Story = {
  args: {
    txData,
    batch: {
      enablesModule: false,
      changes: [
        {
          method: 'setAllowance',
          dataDecoded: allowance('setAllowance', [SPENDER, TOKEN, '500000000', '0', '0']),
          resetsSpent: true,
        },
        { method: 'deleteAllowance', dataDecoded: allowance('deleteAllowance', [SPENDER, TOKEN]), resetsSpent: false },
      ],
      removedSpenders: [SPENDER],
    },
  },
}
