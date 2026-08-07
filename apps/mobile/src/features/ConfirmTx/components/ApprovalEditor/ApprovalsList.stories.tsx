import type { Meta, StoryObj } from '@storybook/react'
import { TokenType } from '@safe-global/store/gateway/types'
import {
  PSEUDO_APPROVAL_VALUES,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { UNLIMITED_APPROVAL_AMOUNT } from '@safe-global/utils/utils/tokens'
import { ApprovalsList } from './ApprovalsList'

const usdcApproval: ApprovalInfo = {
  tokenInfo: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
    logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
    type: TokenType.ERC20,
  },
  tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  spender: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110',
  amount: 1_500_000_000n,
  amountFormatted: '1500',
  method: 'approve',
  transactionIndex: 0,
}

const unlimitedApproval: ApprovalInfo = {
  ...usdcApproval,
  amount: UNLIMITED_APPROVAL_AMOUNT,
  amountFormatted: PSEUDO_APPROVAL_VALUES.UNLIMITED,
  transactionIndex: 1,
}

const meta: Meta<typeof ApprovalsList> = {
  title: 'ConfirmTx/ApprovalsList',
  component: ApprovalsList,
}

export default meta
type Story = StoryObj<typeof ApprovalsList>

export const Editable: Story = {
  args: {
    approvals: [{ ...usdcApproval, isHighValue: false }],
    onEdit: () => undefined,
  },
}

export const UnlimitedAmount: Story = {
  args: {
    approvals: [{ ...unlimitedApproval, isHighValue: true }],
    onEdit: () => undefined,
  },
}

/** Below the Safe's balance — renders with the calm info palette */
export const LowValue: Story = {
  args: {
    approvals: [{ ...usdcApproval, amount: 500_000n, amountFormatted: '0.5', isHighValue: false }],
    onEdit: () => undefined,
  },
}

/** Finite but above the Safe's balance — renders with the warning palette like unlimited */
export const HighValue: Story = {
  args: {
    approvals: [{ ...usdcApproval, amount: 1_000_000_000_000n, amountFormatted: '1000000', isHighValue: true }],
    onEdit: () => undefined,
  },
}

export const ReadOnly: Story = {
  args: {
    approvals: [usdcApproval, unlimitedApproval],
  },
}
