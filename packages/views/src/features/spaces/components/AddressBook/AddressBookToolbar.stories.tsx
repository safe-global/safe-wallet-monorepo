import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import AddressBookToolbar from './AddressBookToolbar'
import { countCategories, countTags } from './filters'
import { WORKSPACE_CONTACTS } from './mocks/fixtures'
import { ADMIN_PERMISSIONS, EMPTY_FILTERS, MEMBER_PERMISSIONS, type ContactFilters } from './types'

/**
 * Search fills the row · Filters (Tags on top, Category below) · Import / Export / Import signers
 * as one button group · "Add contact", the one primary action, rightmost. Open Filters and hover a
 * tag to rename or delete it.
 */
const meta = {
  title: 'Features/Spaces/AddressBook/AddressBookToolbar',
  component: AddressBookToolbar,
  parameters: { layout: 'padded' },
  args: {
    filters: EMPTY_FILTERS,
    onFiltersChange: fn(),
    categoryCounts: countCategories(WORKSPACE_CONTACTS),
    tags: countTags(WORKSPACE_CONTACTS),
    tagEditing: { onRenameOption: fn(), onDeleteOption: fn() },
    permissions: ADMIN_PERMISSIONS,
    missingSignerCount: 4,
    onImport: fn(),
    onExport: fn(),
    onImportSigners: fn(),
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

/** Signers all imported: the group shrinks to Import and Export. */
export const NoMissingSigners: Story = { args: { missingSignerCount: 0 } }

/** Two filters and a search: the Filters badge counts the filters, "Clear" resets all three. */
export const WithActiveFilters: Story = {
  args: { filters: { query: 'harbor', categories: ['eoa'], tags: ['Vendor'] } },
}

/** Members only export. Tags in the Filters dropdown stay editable. */
export const Member: Story = { args: { permissions: MEMBER_PERMISSIONS } }
