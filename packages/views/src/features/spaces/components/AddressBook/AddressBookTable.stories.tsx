import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import Identicon from '@/components/common/Identicon'
import TableCard from '@safe-global/views/components/common/TableCard'
import AddressBookTable from './AddressBookTable'
import { LOCAL_CONTACTS, WORKSPACE_CONTACTS } from './mocks/fixtures'
import { ADMIN_PERMISSIONS, MEMBER_PERMISSIONS } from './types'

/**
 * Contact (name + full address) · Chains · Category · Tags · Added by · ⋮. Every column but the
 * menu sorts; the faint ⇅ shows which. Below the summed column minimums the table goes compact.
 */
const meta = {
  title: 'Features/Spaces/AddressBook/AddressBookTable',
  component: AddressBookTable,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <TableCard>{Story()}</TableCard>],
  args: {
    contacts: WORKSPACE_CONTACTS,
    permissions: ADMIN_PERMISSIONS,
    renderAvatar: (address: string) => <Identicon address={address} size={24} />,
    onEdit: fn(),
    onEditTags: fn(),
    onDelete: fn(),
    onRetryCategory: fn(),
  },
} satisfies Meta<typeof AddressBookTable>

export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {}

/** The ⋮ menu holds only "Edit tags". */
export const Member: Story = { args: { permissions: MEMBER_PERMISSIONS } }

/** An invitee can do nothing yet, so there is no ⋮ menu. */
export const ReadOnly: Story = {
  args: { permissions: { ...MEMBER_PERMISSIONS, canEditTags: false } },
}

/** Row checkboxes for the bulk bar. */
export const Selectable: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<Set<string>>(() => new Set([WORKSPACE_CONTACTS[18].address]))
    return <AddressBookTable {...args} selectedAddresses={selected} onSelectionChange={setSelected} />
  },
}

/** This browser's local book: no Tags or Added by. */
export const LocalBook: Story = { args: { contacts: LOCAL_CONTACTS, book: 'local' } }

/** Without `renderAvatar` the cell falls back to a neutral gradient avatar. */
export const DefaultAvatars: Story = { args: { renderAvatar: undefined } }

/** A narrow container: secondary columns fold into each row's expandable details. */
export const Compact: Story = {
  decorators: [(Story) => <div className="max-w-[420px]">{Story()}</div>],
}

export const Paginated: Story = { args: { pageSize: 8 } }
