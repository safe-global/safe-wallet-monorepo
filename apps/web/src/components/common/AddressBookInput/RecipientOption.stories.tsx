import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import RecipientOption from './RecipientOption'
import RecipientGroupHeader from './RecipientGroupHeader'
import type { RecipientContact } from './provenance'

const DAY_MS = 24 * 60 * 60 * 1000

const baseContact: RecipientContact = {
  name: 'Main Safe',
  address: '0xb58C6653b07E48CB96BeFC5C4Ac3d1F9dfD696Cf',
  chainIds: ['1'],
  createdBy: 'dasha@acme.com',
  createdByUserId: 1,
  lastUpdatedBy: 'dasha@acme.com',
  lastUpdatedByUserId: 1,
  createdAt: new Date(Date.now() - 240 * DAY_MS).toISOString(),
  updatedAt: new Date(Date.now() - 240 * DAY_MS).toISOString(),
  source: ContactSource.space,
}

const meta = {
  component: RecipientOption,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Paper sx={{ width: 420, p: 2 }}>
        <Story />
      </Paper>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof RecipientOption>

export default meta
type Story = StoryObj<typeof meta>

export const WorkspaceContact: Story = {
  args: {
    contact: baseContact,
    prefix: 'eth',
  },
}

export const RecentlyAdded: Story = {
  args: {
    contact: {
      ...baseContact,
      name: 'random',
      createdBy: 'franco@acme.com',
      createdAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
    },
    prefix: 'eth',
  },
}

export const AddressChanged: Story = {
  args: {
    contact: {
      ...baseContact,
      addressChangedAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
      addressChangedBy: 'franco@acme.com',
      previousAddress: '0x8A21d94fE6B3c07Ba5cD11e98f24A6cE0D72f3C9',
    },
    prefix: 'eth',
  },
}

export const LocalContact: Story = {
  args: {
    contact: {
      ...baseContact,
      name: 'Old Treasury Safe',
      createdBy: '',
      createdAt: '',
      source: ContactSource.local,
    },
    prefix: 'eth',
  },
}

export const GroupHeaders: Story = {
  args: {
    contact: baseContact,
  },
  render: () => (
    <>
      <RecipientGroupHeader source={ContactSource.space} workspaceName="Acme Inc" count={4} />
      <RecipientGroupHeader source={ContactSource.private} count={1} />
      <RecipientGroupHeader source={ContactSource.local} count={2} />
    </>
  ),
}
