import type { Meta, StoryObj } from '@storybook/react'
import TokenApprovalsList, { type TokenApprovalItem } from './index'

const approvals: TokenApprovalItem[] = [
  {
    key: 'usdt-1inch',
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    tokenSymbol: 'USDT',
    spenderAddress: '0x111111125421cA6dc452d289314280a0f8842A65',
    spenderLabel: '1inch: Aggregation Router V6',
    spenderHref: 'https://etherscan.io/address/0x111111125421cA6dc452d289314280a0f8842A65',
    amountLabel: 'Unlimited',
    isUnlimited: true,
  },
  {
    key: 'dai-1inch',
    tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    tokenSymbol: 'DAI',
    spenderAddress: '0x111111125421cA6dc452d289314280a0f8842A65',
    spenderLabel: '1inch: Aggregation Router V6',
    amountLabel: '100 DAI',
    isUnlimited: false,
  },
  {
    key: 'usdc-unknown',
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenSymbol: 'USDC',
    spenderAddress: '0xe3490297a08d6fC8Da46Edb7B6142E4F461b62D3',
    spenderLabel: '0xe349...62D3',
    amountLabel: '204 USDC',
    isUnlimited: false,
  },
]

const meta = {
  title: 'Features/TokenApprovals/TokenApprovalsList',
  component: TokenApprovalsList,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-[440px] rounded-md bg-muted px-5 py-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TokenApprovalsList>

export default meta
type Story = StoryObj<typeof meta>

export const WithApprovals: Story = {
  args: { approvals, checkedAtLabel: 'less than a minute ago', onRescan: () => {} },
}

export const NoApprovals: Story = {
  args: { approvals: [], checkedAtLabel: 'less than a minute ago', onRescan: () => {} },
}
