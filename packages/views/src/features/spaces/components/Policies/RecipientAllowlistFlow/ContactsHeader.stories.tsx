import type { Meta, StoryObj } from '@storybook/react'
import ContactsHeader from './ContactsHeader'

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/ContactsHeader',
  component: ContactsHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[480px] bg-card p-1">
        <Story />
      </div>
    ),
  ],
  args: { source: 'workspace', workspaceName: 'Acme Treasury', count: 5 },
} satisfies Meta<typeof ContactsHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Workspace: Story = {}

export const WorkspaceWithoutName: Story = { args: { workspaceName: undefined } }

export const Local: Story = { args: { source: 'local', workspaceName: undefined, count: 3 } }
