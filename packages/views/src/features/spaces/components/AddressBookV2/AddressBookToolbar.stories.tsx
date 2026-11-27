import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Download, FileUp, ListFilter, Plus } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import AddressBookToolbar from './AddressBookToolbar'

/** The search fills the row; Filters and the actions are slots the page fills. */
const meta = {
  title: 'Features/Spaces/AddressBookV2/AddressBookToolbar',
  component: AddressBookToolbar,
  parameters: { layout: 'padded' },
  args: { query: '', onQueryChange: () => {} },
  render: (args) => {
    const [query, setQuery] = useState(args.query)
    return <AddressBookToolbar {...args} query={query} onQueryChange={setQuery} />
  },
} satisfies Meta<typeof AddressBookToolbar>

export default meta
type Story = StoryObj<typeof meta>

const adminActions = (
  <>
    <Button variant="outline" size="action">
      <FileUp aria-hidden="true" data-icon="inline-start" />
      Import
    </Button>
    <Button variant="outline" size="action">
      <Download aria-hidden="true" data-icon="inline-start" />
      Export
    </Button>
    <Button size="action">
      <Plus aria-hidden="true" data-icon="inline-start" />
      Add contact
    </Button>
  </>
)

export const Admin: Story = { args: { actions: adminActions } }

/** Members can only export. */
export const Member: Story = {
  args: {
    actions: (
      <Button variant="outline" size="action">
        <Download aria-hidden="true" data-icon="inline-start" />
        Export
      </Button>
    ),
  },
}

/** The slot later tickets fill with the Filters dropdown. */
export const WithFilters: Story = {
  args: {
    actions: adminActions,
    filters: (
      <Button variant="outline" size="action">
        <ListFilter aria-hidden="true" data-icon="inline-start" />
        Filters
      </Button>
    ),
  },
}

export const Searching: Story = { args: { query: 'treasury', actions: adminActions } }
