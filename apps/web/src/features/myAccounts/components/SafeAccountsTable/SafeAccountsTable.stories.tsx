import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import type { AllSafeItems } from '@/hooks/safes'
import SafeAccountsTable from './index'

const meta = {
  title: 'Features/MyAccounts/SafeAccountsTable',
  component: SafeAccountsTable,
  decorators: [withMockProvider()],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SafeAccountsTable>

export default meta
type Story = StoryObj<typeof meta>

const singleAndMulti: AllSafeItems = [
  {
    name: 'Treasury',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    isPinned: true,
    chainId: '1',
    isReadOnly: false,
    lastVisited: Date.now(),
  },
  {
    name: 'Ops',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    isPinned: true,
    lastVisited: Date.now(),
    safes: [
      {
        name: 'Ops',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        chainId: '1',
        isReadOnly: false,
        isPinned: true,
        lastVisited: Date.now(),
      },
      {
        name: 'Ops',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        chainId: '10',
        isReadOnly: false,
        isPinned: true,
        lastVisited: Date.now(),
      },
    ],
  },
]

export const Default: Story = {
  args: {
    items: singleAndMulti,
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}

export const NameAndBalanceOnly: Story = {
  args: {
    items: singleAndMulti,
    columns: ['name', 'balance', 'actions'],
  },
}

/** Manual-sort mode: hover a row to reveal the drag grip in the left gutter, outside the table. */
export const Reorder: Story = {
  args: {
    items: singleAndMulti,
    reorder: { onReorder: () => {} },
  },
}
