import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import RecipientOption from './RecipientOption'

const meta = {
  component: RecipientOption,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Paper sx={{ width: 480, p: 1 }}>
        <Story />
      </Paper>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof RecipientOption>

export default meta
type Story = StoryObj<typeof meta>

const address = '0x1234567890123456789012345678901234567890'

export const LocalContact: Story = {
  args: {
    contact: {
      name: 'Alice',
      address,
      chainIds: ['1'],
      createdBy: '',
      createdByUserId: 0,
      lastUpdatedBy: '',
      lastUpdatedByUserId: 0,
      createdAt: '',
      updatedAt: '',
      source: ContactSource.local,
    },
    prefix: 'eth',
  },
}

export const SpaceContact: Story = {
  args: {
    contact: {
      name: 'Treasury multisig',
      address,
      chainIds: ['1'],
      createdBy: '0x9876543210987654321098765432109876543210',
      createdByUserId: 1,
      lastUpdatedBy: '',
      lastUpdatedByUserId: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: '',
      source: ContactSource.space,
    },
    prefix: 'eth',
    memberName: 'Bob the admin',
  },
}
