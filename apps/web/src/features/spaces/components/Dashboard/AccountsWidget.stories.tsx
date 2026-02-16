import type { Meta, StoryObj } from '@storybook/react'
import { AccountsWidget } from './AccountsWidget'
import type { Account } from './AccountsWidget'

const MOCK_ACCOUNTS: Account[] = [
  {
    id: '1',
    name: 'My account',
    address: '0x8675...a19b',
    networks: [{ name: 'Ethereum', logoUrl: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png' }],
    balance: '$39.95M',
    owners: '3/5',
  },
  {
    id: '2',
    name: 'Treasury',
    address: '0x8675...a19b',
    networks: [
      { name: 'Ethereum', logoUrl: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png' },
      { name: 'Gnosis Chain', logoUrl: 'https://safe-transaction-assets.safe.global/chains/100/chain_logo.png' },
      { name: 'Base', logoUrl: 'https://safe-transaction-assets.safe.global/chains/8453/chain_logo.png' },
    ],
    balance: '$39.95M',
    owners: '3/5',
  },
  {
    id: '3',
    name: 'Name',
    address: '0x8675...a19b',
    networks: [
      { name: 'Gnosis Chain', logoUrl: 'https://safe-transaction-assets.safe.global/chains/100/chain_logo.png' },
      { name: 'Polygon', logoUrl: 'https://safe-transaction-assets.safe.global/chains/137/chain_logo.png' },
    ],
    balance: '$39.95M',
    owners: '3/5',
    highlighted: true,
  },
]

const meta: Meta<typeof AccountsWidget> = {
  title: 'Spaces/Dashboard/AccountsWidget',
  component: AccountsWidget,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: 'var(--color-background-default, #f4f4f4)', padding: '2rem' }}>
        <div style={{ maxWidth: '560px' }}>
          <Story />
        </div>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    accounts: MOCK_ACCOUNTS,
    remainingCount: 14,
  },
}

export const SingleAccount: Story = {
  args: {
    accounts: MOCK_ACCOUNTS.slice(0, 1),
  },
}

export const Loading: Story = {
  args: {
    accounts: [],
    loading: true,
  },
}

export const ManyAccounts: Story = {
  args: {
    accounts: MOCK_ACCOUNTS,
    remainingCount: 42,
  },
}
