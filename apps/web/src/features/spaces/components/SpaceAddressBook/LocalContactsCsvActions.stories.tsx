import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/decorators'
import LocalContactsCsvActions from './LocalContactsCsvActions'

// CSV Import / Export buttons on the Workspace address book Local contacts tab.
// Export is disabled while there are no local contacts.
const meta = {
  title: 'Features/Spaces/LocalContactsCsvActions',
  component: LocalContactsCsvActions,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    withMockProvider({ shadcn: true }),
    (Story) => (
      <div className="flex flex-wrap gap-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LocalContactsCsvActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { hasContacts: true },
}

export const NoContacts: Story = {
  args: { hasContacts: false },
}
