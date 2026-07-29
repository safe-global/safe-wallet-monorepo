import type { Meta, StoryObj } from '@storybook/react'
import type { AllSafeItems, SafeItem } from '@/hooks/safes'
import { StoreDecorator } from '@/stories/storeDecorator'
import { AccountsWidget } from './AccountsWidget'

const mockSafeItem = (chainId: string, address: string, name?: string): SafeItem => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name,
})

const MOCK_ITEMS: AllSafeItems = [
  mockSafeItem('1', '0x1111111111111111111111111111111111111111', 'My account'),
  mockSafeItem('1', '0x2222222222222222222222222222222222222222', 'Treasury'),
  mockSafeItem('137', '0x3333333333333333333333333333333333333333', 'Vault'),
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
    items: MOCK_ITEMS,
    // 3 accounts shown out of 17 total → "+14" overflow badge.
    totalCount: 17,
    onViewAll: () => {},
  },
}

export const SingleAccount: Story = {
  args: {
    items: MOCK_ITEMS.slice(0, 1),
  },
}

export const Loading: Story = {
  args: {
    items: [],
    loading: true,
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}

export const Error: Story = {
  args: {
    items: [],
    error: 'Failed to load accounts',
    onRefresh: () => console.log('Refresh clicked'),
  },
}
