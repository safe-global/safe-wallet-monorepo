import type { Meta, StoryObj } from '@storybook/react'
import type { SafeItem } from '@/hooks/safes'
import { StoreDecorator } from '@/stories/storeDecorator'
import { AccountsWidget } from './AccountsWidget'
import type { Account } from './types'

const mockSafeItem = (chainId: string): SafeItem => ({
  chainId,
  address: '0x8675309a19b',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

const MOCK_ACCOUNTS: Account[] = [
  {
    name: 'My account',
    address: '0x8675309a19b00000000000000000000000000000',
    href: '/home?safe=eth:0x8675309a19b00000000000000000000000000000',
    safes: [mockSafeItem('1')],
    fiatTotal: '39950000',
    owners: '3/5',
  },
  {
    name: 'Treasury',
    address: '0x8675309a19b00000000000000000000000000001',
    href: '/home?safe=eth:0x8675309a19b00000000000000000000000000001',
    safes: [mockSafeItem('1'), mockSafeItem('100'), mockSafeItem('8453')],
    fiatTotal: '39950000',
    owners: '3/5',
    subAccounts: [
      { chainId: '1', fiatTotal: '20000000', href: '/home?safe=eth:0x8675309a19b00000000000000000000000000001' },
      { chainId: '100', fiatTotal: '15000000', href: '/home?safe=gno:0x8675309a19b00000000000000000000000000001' },
      { chainId: '8453', fiatTotal: '4950000', href: '/home?safe=base:0x8675309a19b00000000000000000000000000001' },
    ],
  },
  {
    name: 'Name',
    address: '0x8675309a19b00000000000000000000000000002',
    href: '/home?safe=gno:0x8675309a19b00000000000000000000000000002',
    safes: [mockSafeItem('100'), mockSafeItem('137')],
    fiatTotal: '39950000',
    owners: '3/5',
    highlighted: true,
    subAccounts: [
      { chainId: '100', fiatTotal: '25000000', href: '/home?safe=gno:0x8675309a19b00000000000000000000000000002' },
      { chainId: '137', fiatTotal: '14950000', href: '/home?safe=matic:0x8675309a19b00000000000000000000000000002' },
    ],
  },
]

const meta: Meta<typeof AccountsWidget> = {
  component: AccountsWidget,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{ settings: { currency: 'usd' } }}>
        <div style={{ backgroundColor: 'var(--color-background-default, #f4f4f4)', padding: '2rem' }}>
          <div style={{ maxWidth: '560px' }}>
            <Story />
          </div>
        </div>
      </StoreDecorator>
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

export const Empty: Story = {
  args: {
    accounts: [],
  },
}

export const Error: Story = {
  args: {
    accounts: [],
    error: 'Failed to load accounts',
    onRefresh: () => console.log('Refresh clicked'),
  },
}
