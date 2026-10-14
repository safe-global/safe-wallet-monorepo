import type { Meta, StoryObj } from '@storybook/react'
import Identicon from '@/components/common/Identicon'
import AddressBookDemo from './mocks/AddressBookDemo'
import { ADDRESSES, LOCAL_CONTACTS, MISSING_SIGNERS, WORKSPACE_CONTACTS } from './mocks/fixtures'
import { ADMIN_PERMISSIONS, EMPTY_FILTERS, MEMBER_PERMISSIONS } from './types'

/**
 * The workspace address book, end to end. Every story is interactive: search, filter, sort, select
 * rows, rename or delete a tag from the Filters dropdown, and open each row's ⋮ menu. Writes only
 * change the story's own state; nothing is sent anywhere.
 *
 * Data: "Lumen Labs", a made-up company with four workspace Safes (Treasury, Payroll, Ops multisig,
 * Grants program), their signers, the DeFi contracts they use (real mainnet addresses), vendors,
 * contractors and two addresses nobody could place.
 */
const meta = {
  title: 'Features/Spaces/AddressBook/Page',
  component: AddressBookDemo,
  parameters: { layout: 'padded' },
  args: {
    contacts: WORKSPACE_CONTACTS,
    localContacts: LOCAL_CONTACTS,
    permissions: ADMIN_PERMISSIONS,
    missingSigners: MISSING_SIGNERS,
    renderAvatar: (address: string) => <Identicon address={address} size={24} />,
  },
} satisfies Meta<typeof AddressBookDemo>

export default meta
type Story = StoryObj<typeof meta>

/** An admin's view: every action, "Import signers (4)" in the button group, "Add contact" rightmost. */
export const Admin: Story = {}

/** A member: no Import, Add, Edit or Delete. Tags stay editable, row by row and in bulk. */
export const Member: Story = {
  args: { permissions: MEMBER_PERMISSIONS },
}

/** All signers already imported: the "Import signers" button disappears from the group. */
export const NoMissingSigners: Story = {
  args: { missingSigners: [] },
}

/** Filters dropdown with Tags "Vendor" and Category "EOA" applied; the trigger shows the count. */
export const Filtered: Story = {
  args: { initialFilters: { ...EMPTY_FILTERS, tags: ['Vendor'], categories: ['eoa'] } },
}

/** A search that matches nothing. */
export const NoResults: Story = {
  args: { initialFilters: { ...EMPTY_FILTERS, query: 'payments-processor' } },
}

/** A brand-new workspace with no contacts. */
export const Empty: Story = {
  args: { contacts: [], localContacts: [], missingSigners: MISSING_SIGNERS },
}

/** Categories still resolving on chain: skeletons in the Category column. */
export const ResolvingCategories: Story = {
  args: {
    contacts: WORKSPACE_CONTACTS.map((contact, index) =>
      contact.category !== 'workspace-safe' && index % 3 === 0 ? { ...contact, category: 'loading' } : contact,
    ),
  },
}

/** Three rows selected: the bulk bar applies or removes tags on all of them, or exports them. */
export const BulkSelection: Story = {
  args: { initialSelection: [ADDRESSES.northwind, ADDRESSES.blueHarbor, ADDRESSES.atlas] },
}

/** More contacts than one page: 75 rows, 25 per page. */
export const ManyContacts: Story = {
  args: {
    contacts: [0, 1, 2]
      .flatMap((copy) =>
        WORKSPACE_CONTACTS.map((contact, index) => ({
          ...contact,
          name: copy === 0 ? contact.name : `${contact.name} ${copy + 1}`,
          address: `0x${(index + copy * 100).toString(16).padStart(4, '0')}${contact.address.slice(6)}`,
        })),
      )
      .slice(0, 75),
  },
}

/** Phone width: the table goes compact and the secondary columns fold into each row's details. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
}

/** Opens straight into each dialog, from the page, for review. */
export const AddContactOpen: Story = { args: { initialDialog: { kind: 'add' } } }
export const EditContactOpen: Story = { args: { initialDialog: { kind: 'edit', address: ADDRESSES.otcDesk } } }
export const EditTagsOpen: Story = { args: { initialDialog: { kind: 'tags', address: ADDRESSES.amara } } }
export const DeleteContactOpen: Story = {
  args: { initialDialog: { kind: 'delete', address: ADDRESSES.exchangeDeposit } },
}
export const ImportOpen: Story = { args: { initialDialog: { kind: 'import' } } }
export const ImportReviewOpen: Story = { args: { initialDialog: { kind: 'import', review: true } } }
export const ImportSignersOpen: Story = { args: { initialDialog: { kind: 'signers' } } }
export const ExportOpen: Story = { args: { initialDialog: { kind: 'export' } } }
