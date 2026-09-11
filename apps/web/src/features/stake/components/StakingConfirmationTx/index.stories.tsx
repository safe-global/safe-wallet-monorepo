import type { Meta, StoryObj } from '@storybook/react'
import type {
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
  NativeStakingWithdrawTransactionInfo,
  TokenInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NativeStakingStatus, TransactionInfoType } from '@safe-global/store/gateway/types'
import StakingConfirmationTx from './index'

const ethToken: TokenInfo = {
  address: '0x0000000000000000000000000000000000000000',
  decimals: 18,
  logoUri: null,
  name: 'Ether',
  symbol: 'ETH',
  trusted: true,
}

const depositOrder: NativeStakingDepositTransactionInfo = {
  type: TransactionInfoType.NATIVE_STAKING_DEPOSIT,
  status: NativeStakingStatus.NOT_STAKED,
  estimatedEntryTime: 691200000, // 8 days
  estimatedExitTime: 259200000, // 3 days
  estimatedWithdrawalTime: 259200000, // 3 days
  fee: 0.15,
  monthlyNrr: 0.032,
  annualNrr: 3.845,
  value: '32000000000000000000', // 32 ETH
  numValidators: 1,
  expectedAnnualReward: '1230000000000000000',
  expectedMonthlyReward: '102000000000000000',
  expectedFiatAnnualReward: 4200.55,
  expectedFiatMonthlyReward: 350.04,
  tokenInfo: ethToken,
  validators: null,
}

const exitOrder: NativeStakingValidatorsExitTransactionInfo = {
  type: TransactionInfoType.NATIVE_STAKING_VALIDATORS_EXIT,
  status: NativeStakingStatus.ACTIVE,
  estimatedExitTime: 259200000, // 3 days
  estimatedWithdrawalTime: 259200000, // 3 days
  value: '64000000000000000000', // 64 ETH
  numValidators: 2,
  tokenInfo: ethToken,
  validators: ['0xabc123', '0xdef456'],
}

const withdrawOrder: NativeStakingWithdrawTransactionInfo = {
  type: TransactionInfoType.NATIVE_STAKING_WITHDRAW,
  value: '32000000000000000000', // 32 ETH
  tokenInfo: ethToken,
  validators: ['0xabc123'],
}

const meta: Meta<typeof StakingConfirmationTx> = {
  component: StakingConfirmationTx,
  title: 'Features/Stake/StakingConfirmationTx',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Deposit: Story = {
  args: {
    order: depositOrder,
  },
}

export const Exit: Story = {
  args: {
    order: exitOrder,
  },
}

export const Withdraw: Story = {
  args: {
    order: withdrawOrder,
  },
}

export const AllVariants: Story = {
  args: {
    order: depositOrder,
  },
  render: () => (
    <div className="flex max-w-xl flex-col gap-8">
      <StakingConfirmationTx order={depositOrder} />
      <StakingConfirmationTx order={exitOrder} />
      <StakingConfirmationTx order={withdrawOrder} />
    </div>
  ),
}
