import type { Meta, StoryObj } from '@storybook/react'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import RecipientGroupHeader from './RecipientGroupHeader'

const meta = {
  component: RecipientGroupHeader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RecipientGroupHeader>

export default meta
type Story = StoryObj<typeof meta>

export const LocalContacts: Story = {
  args: {
    source: ContactSource.local,
    count: 3,
  },
}

export const WorkspaceContacts: Story = {
  args: {
    source: ContactSource.space,
    workspaceName: 'Acme DAO',
    count: 12,
  },
}

export const WorkspaceContactsWithoutName: Story = {
  args: {
    source: ContactSource.space,
    count: 12,
  },
}
