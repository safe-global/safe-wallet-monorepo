import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { FileUp, Plus } from 'lucide-react'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Button } from '@safe-global/views/components/ui/button'
import AddressBookEmptyState from './AddressBookEmptyState'

const meta = {
  title: 'Features/Spaces/AddressBookV2/AddressBookEmptyState',
  component: AddressBookEmptyState,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <TableCard>{Story()}</TableCard>],
} satisfies Meta<typeof AddressBookEmptyState>

export default meta
// The props are a union on `kind`, which `StoryObj<typeof meta>` collapses to `never`.
type Story = StoryObj<typeof AddressBookEmptyState>

/** An admin can add or import the first contact. */
export const EmptyWorkspaceBook: Story = {
  args: {
    kind: 'empty',
    book: 'workspace',
    actions: (
      <>
        <Button variant="outline" size="action">
          <FileUp aria-hidden="true" data-icon="inline-start" />
          Import
        </Button>
        <Button size="action">
          <Plus aria-hidden="true" data-icon="inline-start" />
          Add contact
        </Button>
      </>
    ),
  },
}

/** Members see the same message without the actions. */
export const EmptyWorkspaceBookReadOnly: Story = { args: { kind: 'empty', book: 'workspace' } }

export const EmptyLocalBook: Story = { args: { kind: 'empty', book: 'local' } }

export const NoResults: Story = { args: { kind: 'no-results', onClearSearch: fn() } }
