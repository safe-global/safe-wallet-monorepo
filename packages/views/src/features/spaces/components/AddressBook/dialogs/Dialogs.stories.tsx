import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { countTags } from '../filters'
import {
  ADDRESSES,
  ALL_CHAINS,
  CHAINS,
  IMPORT_REVIEW_ROWS,
  FREQUENT_SUGGESTIONS,
  SUGGESTED_SIGNERS,
  WORKSPACE_CONTACTS,
} from '../mocks/fixtures'
import ContactFormDialog from './ContactFormDialog'
import DeleteContactDialog from './DeleteContactDialog'
import EditTagsDialog from './EditTagsDialog'
import ExportDialog from './ExportDialog'
import ImportDialog from './ImportDialog'
import AddSuggestionsDialog from './AddSuggestionsDialog'

/**
 * Every address book dialog on its own, with the callbacks logged in the Actions panel. The Page
 * stories open the same dialogs from the table.
 */
const meta = {
  title: 'Features/Spaces/AddressBook/Dialogs',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const tagOptions = countTags(WORKSPACE_CONTACTS)
const otcDesk = WORKSPACE_CONTACTS.find((contact) => contact.address === ADDRESSES.otcDesk)!
const amara = WORKSPACE_CONTACTS.find((contact) => contact.address === ADDRESSES.amara)!

/** Address, name, networks and tags. The address preview groups the characters once it is valid. */
export const AddContact: Story = {
  render: () => (
    <ContactFormDialog mode="add" chains={ALL_CHAINS} tagOptions={tagOptions} onSubmit={fn()} onClose={fn()} />
  ),
}

/** The address of a saved contact is read-only. Save stays disabled until something changes. */
export const EditContact: Story = {
  render: () => (
    <ContactFormDialog
      mode="edit"
      initialValues={{
        address: otcDesk.address,
        name: otcDesk.name,
        chainIds: otcDesk.chains.map((chain) => chain.chainId),
        tags: otcDesk.tags,
      }}
      chains={ALL_CHAINS}
      tagOptions={tagOptions}
      onSubmit={fn()}
      onClose={fn()}
    />
  ),
}

/** A save the gateway rejected. */
export const EditContactError: Story = {
  render: () => (
    <ContactFormDialog
      mode="edit"
      initialValues={{ address: amara.address, name: amara.name, chainIds: ['8453', '10'], tags: amara.tags }}
      chains={ALL_CHAINS}
      tagOptions={tagOptions}
      onSubmit={fn()}
      onClose={fn()}
      error="The address book already has 500 contacts. Delete some before adding more."
    />
  ),
}

/** Every active member can edit tags. "Search or create a tag" creates one inline. */
export const EditTags: Story = {
  render: () => <EditTagsDialog contact={amara} tagOptions={tagOptions} onSave={fn()} onClose={fn()} />,
}

export const DeleteContact: Story = {
  render: () => <DeleteContactDialog contact={otcDesk} onConfirm={fn()} onClose={fn()} />,
}

/** Step one: the CSV drop zone, with a shortcut to the Suggested tab while it has suggestions. */
export const Import: Story = {
  render: () => (
    <ImportDialog
      suggestionCount={SUGGESTED_SIGNERS.length}
      onViewSuggestions={fn()}
      onFileSelected={fn()}
      onConfirm={fn()}
      onBack={fn()}
      onClose={fn()}
    />
  ),
}

export const ImportFileError: Story = {
  render: () => (
    <ImportDialog
      onFileSelected={fn()}
      fileError="Line 1 must be the header: address,name,chainId (tags optional)."
      onConfirm={fn()}
      onBack={fn()}
      onClose={fn()}
    />
  ),
}

/**
 * Step two: one file that hits every status. Invalid and duplicate rows are skipped, the look-alike
 * of "Treasury" needs "I verified this address" before it can be ticked, and a differing name keeps
 * the saved one unless renamed.
 */
export const ImportReview: Story = {
  render: () => (
    <ImportDialog reviewRows={IMPORT_REVIEW_ROWS} onFileSelected={fn()} onConfirm={fn()} onBack={fn()} onClose={fn()} />
  ),
}

/** Naming chosen suggestions before they join the workspace book. Empty names keep the suggestion. */
export const AddSuggestions: Story = {
  render: () => (
    <AddSuggestionsDialog
      suggestions={[...SUGGESTED_SIGNERS.slice(0, 2), FREQUENT_SUGGESTIONS[0]]}
      onAdd={fn()}
      onClose={fn()}
    />
  ),
}

/** A long list scrolls inside the dialog instead of growing it. */
export const AddManySuggestions: Story = {
  render: () => (
    <AddSuggestionsDialog
      suggestions={Array.from({ length: 14 }, (_, index) => ({
        ...SUGGESTED_SIGNERS[index % SUGGESTED_SIGNERS.length],
        address: `0x${(index + 1).toString(16).padStart(4, '0')}${SUGGESTED_SIGNERS[index % SUGGESTED_SIGNERS.length].address.slice(6)}`,
        suggestedName: `Treasury signer ${index + 5}`,
        chains: [CHAINS.ethereum],
      }))}
      onAdd={fn()}
      onClose={fn()}
    />
  ),
}

/** CSV only. "Selected" is disabled when nothing is selected. */
export const Export: Story = {
  render: () => <ExportDialog counts={{ all: 28, 'current-view': 6, selected: 0 }} onExport={fn()} onClose={fn()} />,
}

export const ExportSelected: Story = {
  render: () => (
    <ExportDialog
      counts={{ all: 28, 'current-view': 6, selected: 3 }}
      initialScope="selected"
      onExport={fn()}
      onClose={fn()}
    />
  ),
}
