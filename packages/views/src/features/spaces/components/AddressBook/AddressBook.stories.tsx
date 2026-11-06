import type { Meta, StoryObj } from '@storybook/react'
import Identicon from '@/components/common/Identicon'
import AddressBookDemo from './mocks/AddressBookDemo'
import PageBackground from './mocks/PageBackground'
import {
  ADDRESSES,
  FREQUENT_SUGGESTIONS,
  LOCAL_CONTACTS,
  SUGGESTED_SIGNERS,
  WORKSPACE_CONTACTS,
} from './mocks/fixtures'
import { SIGNER_TAG } from './tags/systemTags'
import { ADMIN_PERMISSIONS, EMPTY_FILTERS, MEMBER_PERMISSIONS } from './types'

/**
 * The workspace address book, end to end. Every story is interactive: search, filter, sort, select
 * rows, rename or delete a tag from the Filters dropdown, and open each row's ⋮ menu. Writes only
 * change the story's own state; nothing is sent anywhere.
 *
 * Data: "Lumen Labs", a made-up company with four workspace Safes (Treasury, Payroll, Ops multisig,
 * Grants program), their signers, the DeFi contracts they use (real mainnet addresses), vendors and
 * contractors. Workspace Safes and their signers show "Workspace Safe" or "Signer" in the Type column,
 * set by the app; nobody can edit or delete them.
 */
const meta = {
  title: 'Features/Spaces/AddressBook/Page',
  component: AddressBookDemo,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <PageBackground>{Story()}</PageBackground>],
  args: {
    contacts: WORKSPACE_CONTACTS,
    localContacts: LOCAL_CONTACTS,
    permissions: ADMIN_PERMISSIONS,
    suggestions: SUGGESTED_SIGNERS,
    renderAvatar: (address: string) => <Identicon address={address} size={24} />,
  },
} satisfies Meta<typeof AddressBookDemo>

export default meta
type Story = StoryObj<typeof meta>

/** An admin's view: Import · Export in one group, "Add contact" rightmost, and a Suggested tab with 4 signers. */
export const Admin: Story = {}

/** A member: no Import, Add, Edit or Delete. Tags stay editable, row by row and in bulk. */
export const Member: Story = {
  args: { permissions: MEMBER_PERMISSIONS },
}

/**
 * The Suggested tab: signers of the workspace Safes that aren't in the book yet, each with why it's
 * suggested and "Add to workspace". Tick several to add them in one go.
 */
export const Suggested: Story = {
  args: { initialTab: 'suggested' },
}

/** Suggestions with both kinds of reason. */
export const SuggestedWithFrequentAddresses: Story = {
  args: { initialTab: 'suggested', suggestions: [...SUGGESTED_SIGNERS, ...FREQUENT_SUGGESTIONS] },
}

/** A member sees the suggestions but can't add them. */
export const SuggestedAsMember: Story = {
  args: { initialTab: 'suggested', permissions: MEMBER_PERMISSIONS },
}

/** Every signer is already in the book. */
export const NoSuggestions: Story = {
  args: { initialTab: 'suggested', suggestions: [] },
}

/** Filtered to Type "Signer": every signer of a workspace Safe. */
export const Filtered: Story = {
  args: { initialFilters: { ...EMPTY_FILTERS, tags: [SIGNER_TAG] } },
}

/** A search that matches nothing. */
export const NoResults: Story = {
  args: { initialFilters: { ...EMPTY_FILTERS, query: 'payments-processor' } },
}

/** A brand-new workspace with no contacts. */
export const Empty: Story = {
  args: { contacts: [], localContacts: [] },
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
export const AddSuggestionsOpen: Story = {
  args: {
    initialTab: 'suggested',
    initialDialog: { kind: 'add-suggestions', addresses: SUGGESTED_SIGNERS.slice(0, 2).map((item) => item.address) },
  },
}
export const ExportOpen: Story = { args: { initialDialog: { kind: 'export' } } }
