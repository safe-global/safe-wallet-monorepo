import type { Meta, StoryObj } from '@storybook/react'
import type { TokenInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { createMockStory } from '@/stories/mocks'
import QueueTxDetails from '.'

const SAFE = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
const RECIPIENT = '0x6810e776880C02933D47DB1b9fc05908e5386b96'
const OTHER_SAFE = '0x8675B754342754A30A2AeF474D114d8460bca19b'

const token = (symbol: string, decimals = 18): TokenInfo => ({
  address: RECIPIENT,
  decimals,
  name: symbol,
  symbol,
  trusted: true,
})

const tx = (txInfo: object, nonce = 12): Transaction =>
  ({
    id: `multisig_${SAFE}_${nonce}`,
    timestamp: 1_767_225_600_000,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo,
    executionInfo: {
      type: 'MULTISIG',
      nonce,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [],
    },
  }) as unknown as Transaction

const VARIANTS: Array<[string, Transaction]> = [
  [
    'Transfer',
    tx({
      type: 'Transfer',
      direction: 'OUTGOING',
      sender: { value: SAFE },
      recipient: { value: RECIPIENT },
      transferInfo: { type: 'ERC20', tokenAddress: RECIPIENT, value: '1000000', tokenSymbol: 'USDC', decimals: 6 },
    }),
  ],
  [
    'Sell order',
    tx({
      type: 'SwapOrder',
      kind: 'sell',
      sellAmount: '2000000000000000000',
      buyAmount: '6000000000',
      sellToken: token('WETH'),
      buyToken: token('USDC', 6),
    }),
  ],
  [
    'Add signer',
    tx({
      type: 'SettingsChange',
      dataDecoded: { method: 'addOwnerWithThreshold', parameters: [] },
      settingsInfo: { type: 'ADD_OWNER', owner: { value: RECIPIENT, name: 'Alice' }, threshold: 2 },
    }),
  ],
  [
    'Nested',
    tx({
      type: 'Custom',
      to: { value: OTHER_SAFE },
      dataSize: '36',
      value: '0',
      isCancellation: false,
      methodName: 'approveHash',
    }),
  ],
  [
    'Bridge',
    tx({
      type: 'SwapAndBridge',
      fromToken: token('USDC', 6),
      recipient: { value: SAFE },
      explorerUrl: null,
      status: 'AWAITING_EXECUTION',
      substatus: 'AWAITING_EXECUTION',
      fees: null,
      fromAmount: '1500000000',
      toChain: '137',
      toToken: token('USDC', 6),
      toAmount: '1490000000',
    }),
  ],
  [
    'Rejection',
    tx({ type: 'Custom', to: { value: SAFE }, dataSize: '0', value: '0', isCancellation: true, methodName: null }),
  ],
  [
    'Staking exit',
    tx({ type: 'NativeStakingValidatorsExit', numValidators: 2, validators: [], tokenInfo: token('ETH') }),
  ],
  [
    'Undecoded call',
    tx({
      type: 'Custom',
      methodName: null,
      to: { value: RECIPIENT },
      dataSize: '68',
      value: '0',
      isCancellation: false,
    }),
  ],
]

const QueueTxDetailsVariants = () => (
  <div className="grid max-w-xl grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
    {VARIANTS.map(([label, transaction]) => (
      <div key={label} className="contents">
        <span className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
          <QueueTxDetails.Type tx={transaction} />
        </span>
        <span className="min-w-0">
          <QueueTxDetails.Summary tx={transaction} />
        </span>
      </div>
    ))}
  </div>
)

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', layout: 'paper', shadcn: true })

const meta = {
  title: 'Features/Spaces/Transactions/QueueTxDetails',
  component: QueueTxDetailsVariants,
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof QueueTxDetailsVariants>

export default meta
type Story = StoryObj<typeof meta>

/** The type tag and summary of each kind of transaction the queue words differently */
export const Variants: Story = {}
