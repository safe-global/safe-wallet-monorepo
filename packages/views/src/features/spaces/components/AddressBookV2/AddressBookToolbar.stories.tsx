import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Download, FileUp, ListFilter, Plus } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { ButtonGroup } from '@safe-global/views/components/ui/button-group'
import AddressBookToolbar from './AddressBookToolbar'

/** The search fills the row; Filters and the actions are slots the page fills. Import · Export is one button group. */
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
    <ButtonGroup>
      <Button variant="outline" size="lg">
        <FileUp aria-hidden="true" data-icon="inline-start" />
        Import
      </Button>
      <Button variant="outline" size="lg">
        <Download aria-hidden="true" data-icon="inline-start" />
        Export
      </Button>
    </ButtonGroup>
    <Button size="lg">
      <Plus aria-hidden="true" data-icon="inline-start" className="text-green-500" />
      Add contact
    </Button>
  </>
)

const filters = (
  <Button variant="outline" size="lg">
    <ListFilter aria-hidden="true" data-icon="inline-start" />
    Filters
  </Button>
)

/** Local contacts: no tags, so no Filters. */
export const Admin: Story = { args: { actions: adminActions } }

/** Workspace contacts as a member: Search, Filters and Export only. */
export const Member: Story = {
  args: {
    searchScope: 'name, address or tag',
    filters,
    actions: (
      <Button variant="outline" size="lg">
        <Download aria-hidden="true" data-icon="inline-start" />
        Export
      </Button>
    ),
  },
}

/** Workspace contacts as an admin: the search also matches tags. */
export const WithFilters: Story = {
  args: { searchScope: 'name, address or tag', actions: adminActions, filters },
}

export const Searching: Story = { args: { query: 'treasury', actions: adminActions } }
