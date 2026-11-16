import type { Meta, StoryObj } from '@storybook/react'
import type { TokenInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType, TransactionStatus } from '@safe-global/store/gateway/types'
import { createMockStory } from '@/stories/mocks'
import QueueTxDetails from '.'

const SAFE = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
const OTHER_SAFE = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const SIGNER = '0x6810e776880C02933D47DB1b9fc05908e5386b96'
const TIMESTAMP = 1_767_225_600_000

const token = (symbol: string, address: string, decimals = 18): TokenInfo => ({
  address,
  decimals,
  name: symbol,
  symbol,
  trusted: true,
})

const WETH = token('WETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
const USDC = token('USDC', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6)
const ETH = token('ETH', '0x0000000000000000000000000000000000000000')

const tx = (id: string, txInfo: object): Transaction =>
  ({
    id,
    timestamp: TIMESTAMP,
    txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
    txInfo,
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce: 57,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [{ value: SIGNER }],
    },
    txHash: null,
  }) as Transaction

const VARIANTS: Array<{ label: string; tx: Transaction }> = [
  {
    label: 'Settings',
    tx: tx('settings', {
      type: 'SettingsChange',
      dataDecoded: { method: 'addOwnerWithThreshold', parameters: [] },
      settingsInfo: { type: 'ADD_OWNER', owner: { value: SIGNER, name: 'Alice' }, threshold: 2 },
    }),
  },
  {
    label: 'Cancellation',
    tx: tx('cancellation', {
      type: 'Custom',
      to: { value: SAFE },
      dataSize: '0',
      value: '0',
      isCancellation: true,
      methodName: null,
    }),
  },
  {
    label: 'Nested',
    tx: tx('nested', {
      type: 'Custom',
      to: { value: OTHER_SAFE },
      dataSize: '36',
      value: '0',
      isCancellation: false,
      methodName: 'approveHash',
    }),
  },
  {
    label: 'Swap',
    tx: tx('swap', {
      type: 'SwapOrder',
      uid: '0x1',
      status: 'open',
      kind: 'sell',
      orderClass: 'market',
      validUntil: TIMESTAMP / 1000,
      sellAmount: '2000000000000000000',
      buyAmount: '6000000000',
      executedSellAmount: '0',
      executedBuyAmount: '0',
      sellToken: WETH,
      buyToken: USDC,
      explorerUrl: 'https://explorer.cow.fi',
      executedFee: '0',
      executedFeeToken: WETH,
      owner: SAFE,
    }),
  },
  {
    label: 'Bridge',
    tx: tx('bridge', {
      type: 'SwapAndBridge',
      fromToken: USDC,
      recipient: { value: SAFE },
      explorerUrl: null,
      status: 'AWAITING_EXECUTION',
      substatus: 'AWAITING_EXECUTION',
      fees: null,
      fromAmount: '1500000000',
      toChain: '137',
      toToken: USDC,
      toAmount: '1490000000',
    }),
  },
  {
    label: 'Staking',
    tx: tx('staking', {
      type: 'NativeStakingValidatorsExit',
      status: 'ACTIVE',
      estimatedExitTime: 0,
      estimatedWithdrawalTime: 0,
      value: '64000000000000000000',
      numValidators: 2,
      tokenInfo: ETH,
      validators: [],
    }),
  },
]

const setup = createMockStory({ scenario: 'efSafe', layout: 'paper', shadcn: true })

const meta = {
  title: 'Features/Spaces/Transactions/QueueTxDetails',
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The type tag and summary the queue shows for each kind of transaction it words itself. */
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-[8rem_auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
      {VARIANTS.map(({ label, tx }) => (
        <div key={label} className="contents">
          <span className="text-muted-foreground">{label}</span>
          <span className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
            <QueueTxDetails.Type tx={tx} />
          </span>
          <span className="min-w-0">
            <QueueTxDetails.Summary tx={tx} />
          </span>
        </div>
      ))}
    </div>
  ),
}
