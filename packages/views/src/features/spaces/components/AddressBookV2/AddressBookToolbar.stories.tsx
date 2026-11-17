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

export const Admin: Story = { args: { actions: adminActions } }

/** Members can only export. */
export const Member: Story = {
  args: {
    actions: (
      <ButtonGroup>
        <Button variant="outline" size="lg">
          <Download aria-hidden="true" data-icon="inline-start" />
          Export
        </Button>
      </ButtonGroup>
    ),
  },
}

const filters = (
  <Button variant="outline" size="lg">
    <ListFilter aria-hidden="true" data-icon="inline-start" />
    Filters
  </Button>
)

/** The Workspace contacts toolbar: its search also matches tags. */
export const WithFilters: Story = {
  args: { searchScope: 'name, address or tag', actions: adminActions, filters },
}

export const Searching: Story = { args: { query: 'treasury', actions: adminActions } }
