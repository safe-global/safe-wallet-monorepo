import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import AddressBookToolbar from './AddressBookToolbar'
import PageBackground from './mocks/PageBackground'
import { countSystemTags, countTags } from './filters'
import { WORKSPACE_CONTACTS } from './mocks/fixtures'
import { ADMIN_PERMISSIONS, EMPTY_FILTERS, MEMBER_PERMISSIONS, type ContactFilters } from './types'

/**
 * Search fills the row · Filters (automatic tags, then the team's) · Import / Export
 * as one button group · "Add contact", the one primary action, rightmost. Open Filters and hover a
 * tag to rename or delete it.
 */
const meta = {
  title: 'Features/Spaces/AddressBook/AddressBookToolbar',
  component: AddressBookToolbar,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <PageBackground>{Story()}</PageBackground>],
  args: {
    filters: EMPTY_FILTERS,
    onFiltersChange: fn(),
    systemTags: countSystemTags(WORKSPACE_CONTACTS),
    tags: countTags(WORKSPACE_CONTACTS),
    tagEditing: { onRenameOption: fn(), onDeleteOption: fn() },
    permissions: ADMIN_PERMISSIONS,
    onImport: fn(),
    onExport: fn(),
    onAddContact: fn(),
  },
  render: (args) => {
    const [filters, setFilters] = useState<ContactFilters>(args.filters)
    return <AddressBookToolbar {...args} filters={filters} onFiltersChange={setFilters} />
  },
} satisfies Meta<typeof AddressBookToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {}

/** Two filters and a search: the Filters badge counts the filters, "Clear" resets all three. */
export const WithActiveFilters: Story = {
  args: { filters: { query: 'harbor', tags: ['Vendor', 'Legal'] } },
}

/** Members only export. Tags in the Filters dropdown stay editable. */
export const Member: Story = { args: { permissions: MEMBER_PERMISSIONS } }
