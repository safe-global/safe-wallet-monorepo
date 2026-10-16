import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import Identicon from '@/components/common/Identicon'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import AddressBookTable from './AddressBookTable'
import { LOCAL_CONTACTS, WORKSPACE_CONTACTS } from './mocks/fixtures'
import { FULL_PERMISSIONS, NO_PERMISSIONS } from './types'

/**
 * Contact (name + full address) · Chains · Added by · ⋮. Every column but the menu sorts. Below the
 * summed column minimums the table goes compact.
 */
const meta = {
  title: 'Features/Spaces/AddressBook/AddressBookTable',
  component: AddressBookTable,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <TableCard>{Story()}</TableCard>],
  args: {
    contacts: WORKSPACE_CONTACTS,
    permissions: FULL_PERMISSIONS,
    renderAvatar: (address: string) => <Identicon address={address} size={24} />,
    onEdit: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof AddressBookTable>

export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {}

/** A member or an invitee may not change workspace contacts, so there is no ⋮ menu. */
export const ReadOnly: Story = { args: { permissions: NO_PERMISSIONS } }

/** This browser's local book: no Added by, a share action per row, and shared contacts dimmed. */
export const LocalBook: Story = {
  args: {
    contacts: LOCAL_CONTACTS,
    book: 'local',
    renderRowAction: (contact, { isCompact }) =>
      contact.isShared ? (
        <Badge variant="secondary">Already shared</Badge>
      ) : (
        <Button variant="outline" size={isCompact ? 'icon-sm' : 'sm'}>
          {isCompact ? '+' : 'Add to Workspace'}
        </Button>
      ),
  },
}

/** Without `renderAvatar` the cell falls back to a neutral gradient avatar. */
export const DefaultAvatars: Story = { args: { renderAvatar: undefined } }

/** A narrow container: secondary columns fold into each row's expandable details. */
export const Compact: Story = {
  decorators: [(Story) => <div className="max-w-[420px]">{Story()}</div>],
}

export const Paginated: Story = { args: { pageSize: 4 } }
