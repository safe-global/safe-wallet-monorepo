import { useMemo, useState, type ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import TableCard from '@safe-global/views/components/common/TableCard'
import AddressBookEmptyState from '../AddressBookEmptyState'
import AddressBookTable from '../AddressBookTable'
import AddressBookToolbar from '../AddressBookToolbar'
import BulkActionBar from '../BulkActionBar'
import ContactFormDialog, { type ContactFormValues } from '../dialogs/ContactFormDialog'
import DeleteContactDialog from '../dialogs/DeleteContactDialog'
import EditTagsDialog from '../dialogs/EditTagsDialog'
import ExportDialog, { type ExportScope } from '../dialogs/ExportDialog'
import ImportDialog from '../dialogs/ImportDialog'
import ImportSignersDialog, { type ImportedSigner } from '../dialogs/ImportSignersDialog'
import { countCategories, countTags, filterContacts } from '../filters'
import { dedupeTags, hasTag, validateTag, withoutTags } from '../tags/tagRules'
import {
  EMPTY_FILTERS,
  type AddressBookContact,
  type AddressBookPermissions,
  type ContactFilters,
  type MissingSigner,
} from '../types'
import { ALL_CHAINS, IMPORT_REVIEW_ROWS, MEMBERS } from './fixtures'

export type DemoDialog =
  | { kind: 'add' }
  | { kind: 'edit'; address: string }
  | { kind: 'tags'; address: string }
  | { kind: 'delete'; address: string }
  | { kind: 'import'; review?: boolean }
  | { kind: 'signers' }
  | { kind: 'export'; scope?: ExportScope }

export type AddressBookDemoProps = {
  contacts: AddressBookContact[]
  localContacts?: AddressBookContact[]
  permissions: AddressBookPermissions
  missingSigners?: MissingSigner[]
  renderAvatar?: (address: string) => ReactNode
  initialFilters?: ContactFilters
  initialDialog?: DemoDialog
  initialSelection?: string[]
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * The whole workspace address book page, wired to in-memory state so every flow can be tried in
 * Storybook: search, filters, sorting, tag rename and delete, add, edit, tags, delete, bulk tags,
 * import with review, import signers and export. Writes only change this story's state.
 */
const AddressBookDemo = ({
  contacts: initialContacts,
  localContacts = [],
  permissions,
  missingSigners: initialMissingSigners = [],
  renderAvatar,
  initialFilters = EMPTY_FILTERS,
  initialDialog,
  initialSelection = [],
}: AddressBookDemoProps) => {
  const [contacts, setContacts] = useState(initialContacts)
  const [missingSigners, setMissingSigners] = useState(initialMissingSigners)
  const [tab, setTab] = useState<'workspace' | 'local'>('workspace')
  const [filters, setFilters] = useState(initialFilters)
  const [selection, setSelection] = useState<Set<string>>(() => new Set(initialSelection))
  const [dialog, setDialog] = useState<DemoDialog | undefined>(initialDialog)
  const [notice, setNotice] = useState<string>()

  const book = tab === 'workspace' ? contacts : localContacts
  const visible = useMemo(() => filterContacts(book, filters), [book, filters])
  const tagCounts = useMemo(() => countTags(contacts), [contacts])
  const categoryCounts = useMemo(() => countCategories(book), [book])
  const selected = contacts.filter((contact) => selection.has(contact.address))
  const find = (address: string) => contacts.find((contact) => same(contact.address, address))
  const close = () => setDialog(undefined)

  const updateContact = (address: string, patch: Partial<AddressBookContact>) =>
    setContacts((prev) => prev.map((contact) => (same(contact.address, address) ? { ...contact, ...patch } : contact)))

  const chainsFor = (chainIds: string[]) => ALL_CHAINS.filter((chain) => chainIds.includes(chain.chainId))

  const handleSaveContact = (values: ContactFormValues) => {
    if (dialog?.kind === 'edit') {
      updateContact(values.address, { name: values.name, chains: chainsFor(values.chainIds), tags: values.tags })
    } else {
      setContacts((prev) => [
        {
          address: values.address,
          name: values.name,
          chains: chainsFor(values.chainIds),
          category: 'eoa',
          signerOf: [],
          tags: values.tags,
          addedBy: MEMBERS.maya,
        },
        ...prev,
      ])
    }
    close()
  }

  const handleRenameTag = (from: string, to: string): string | undefined => {
    const error = validateTag(to)
    if (error) return error
    setContacts((prev) =>
      prev.map((contact) =>
        hasTag(contact.tags, from)
          ? { ...contact, tags: dedupeTags(contact.tags.map((tag) => (same(tag, from) ? to : tag))) }
          : contact,
      ),
    )
    setFilters((prev) => ({ ...prev, tags: prev.tags.map((tag) => (same(tag, from) ? to : tag)) }))
    return undefined
  }

  const handleDeleteTag = (tag: string) => {
    setContacts((prev) => prev.map((contact) => ({ ...contact, tags: withoutTags(contact.tags, [tag]) })))
    setFilters((prev) => ({ ...prev, tags: withoutTags(prev.tags, [tag]) }))
  }

  const handleBulkTags = ({ added, removed }: { added: string[]; removed: string[] }) =>
    setContacts((prev) =>
      prev.map((contact) =>
        selection.has(contact.address)
          ? { ...contact, tags: dedupeTags([...withoutTags(contact.tags, removed), ...added]) }
          : contact,
      ),
    )

  const handleImportSigners = (signers: ImportedSigner[]) => {
    setContacts((prev) => [
      ...signers.map((signer) => {
        const source = missingSigners.find((missing) => same(missing.address, signer.address))
        return {
          address: signer.address,
          name: signer.name,
          chains: chainsFor(signer.chainIds),
          category: 'eoa' as const,
          signerOf: source?.safes ?? [],
          tags: signer.tags,
          addedBy: MEMBERS.maya,
        }
      }),
      ...prev,
    ])
    setMissingSigners((prev) =>
      prev.filter((missing) => !signers.some((signer) => same(signer.address, missing.address))),
    )
    close()
  }

  const editing = dialog && 'address' in dialog ? find(dialog.address) : undefined

  return (
    <div className="flex flex-col gap-6">
      <Typography variant="h2" className="leading-[1] font-bold tracking-tight">
        Address book
      </Typography>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as 'workspace' | 'local')
          setFilters(EMPTY_FILTERS)
          setSelection(new Set())
        }}
      >
        <TabsList variant="underline" className="mb-4">
          <TabsTrigger value="workspace">Workspace contacts ({contacts.length})</TabsTrigger>
          {localContacts.length > 0 && <TabsTrigger value="local">Local contacts ({localContacts.length})</TabsTrigger>}
        </TabsList>

        <div className="flex flex-col gap-3">
          {book.length > 0 && (
            <AddressBookToolbar
              filters={filters}
              onFiltersChange={setFilters}
              categoryCounts={categoryCounts}
              tags={tab === 'workspace' ? tagCounts : []}
              tagEditing={
                tab === 'workspace' && permissions.canEditTags
                  ? {
                      onRenameOption: handleRenameTag,
                      onDeleteOption: handleDeleteTag,
                      deleteConfirmation: (option) => {
                        const count = tagCounts.find(({ tag }) => same(tag, option.value))?.count ?? 0
                        return `Delete ‘${option.value}’ from ${count} ${count === 1 ? 'contact' : 'contacts'}?`
                      },
                    }
                  : undefined
              }
              permissions={tab === 'workspace' ? permissions : { canAdd: false, canImport: false }}
              missingSignerCount={tab === 'workspace' ? missingSigners.length : 0}
              onImport={() => setDialog({ kind: 'import' })}
              onExport={() => setDialog({ kind: 'export' })}
              exportDisabled={book.length === 0}
              onImportSigners={() => setDialog({ kind: 'signers' })}
              onAddContact={() => setDialog({ kind: 'add' })}
            />
          )}

          {tab === 'workspace' && (
            <BulkActionBar
              selected={selected}
              tagOptions={tagCounts}
              canEditTags={permissions.canEditTags}
              onTagsChange={handleBulkTags}
              onExportSelected={() => setDialog({ kind: 'export', scope: 'selected' })}
              onClear={() => setSelection(new Set())}
            />
          )}

          {notice && (
            <p className="text-muted-foreground text-xs" role="status">
              {notice}
            </p>
          )}

          <TableCard>
            <TabsContent value={tab}>
              {book.length === 0 ? (
                <AddressBookEmptyState
                  kind="empty"
                  canAdd={permissions.canAdd}
                  onAddContact={() => setDialog({ kind: 'add' })}
                  onImport={() => setDialog({ kind: 'import' })}
                />
              ) : visible.length === 0 ? (
                <AddressBookEmptyState kind="no-results" onClearFilters={() => setFilters(EMPTY_FILTERS)} />
              ) : (
                <AddressBookTable
                  contacts={visible}
                  book={tab}
                  permissions={
                    tab === 'workspace'
                      ? permissions
                      : { ...permissions, canEditTags: false, canEdit: true, canDelete: true }
                  }
                  renderAvatar={renderAvatar}
                  selectedAddresses={tab === 'workspace' && permissions.canEditTags ? selection : undefined}
                  onSelectionChange={tab === 'workspace' && permissions.canEditTags ? setSelection : undefined}
                  onEdit={(contact) => setDialog({ kind: 'edit', address: contact.address })}
                  onEditTags={(contact) => setDialog({ kind: 'tags', address: contact.address })}
                  onDelete={(contact) => setDialog({ kind: 'delete', address: contact.address })}
                  onRetryCategory={(contact) => updateContact(contact.address, { category: 'eoa' })}
                />
              )}
            </TabsContent>
          </TableCard>
        </div>
      </Tabs>

      {dialog?.kind === 'add' && (
        <ContactFormDialog
          mode="add"
          chains={ALL_CHAINS}
          tagOptions={tagCounts}
          onSubmit={handleSaveContact}
          onClose={close}
        />
      )}
      {dialog?.kind === 'edit' && editing && (
        <ContactFormDialog
          mode="edit"
          initialValues={{
            address: editing.address,
            name: editing.name,
            chainIds: editing.chains.map((chain) => chain.chainId),
            tags: editing.tags,
          }}
          chains={ALL_CHAINS}
          tagOptions={tagCounts}
          onSubmit={handleSaveContact}
          onClose={close}
        />
      )}
      {dialog?.kind === 'tags' && editing && (
        <EditTagsDialog
          contact={editing}
          tagOptions={tagCounts}
          onSave={(tags) => {
            updateContact(editing.address, { tags })
            close()
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === 'delete' && editing && (
        <DeleteContactDialog
          contact={editing}
          onConfirm={() => {
            setContacts((prev) => prev.filter((contact) => !same(contact.address, editing.address)))
            close()
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === 'import' && (
        <ImportDialog
          missingSignerCount={missingSigners.length}
          onImportSigners={() => setDialog({ kind: 'signers' })}
          onFileSelected={() => setDialog({ kind: 'import', review: true })}
          reviewRows={dialog.review ? IMPORT_REVIEW_ROWS : undefined}
          onConfirm={(rows) => {
            setNotice(`Imported ${rows.length} rows from the file (demo: nothing was written).`)
            close()
          }}
          onBack={() => setDialog({ kind: 'import' })}
          onClose={close}
        />
      )}
      {dialog?.kind === 'signers' && (
        <ImportSignersDialog signers={missingSigners} onImport={handleImportSigners} onClose={close} />
      )}
      {dialog?.kind === 'export' && (
        <ExportDialog
          counts={{ all: book.length, 'current-view': visible.length, selected: selected.length }}
          initialScope={dialog.scope}
          onExport={(scope) => {
            setNotice(`Exported a CSV of the "${scope}" contacts (demo: no file was downloaded).`)
            close()
          }}
          onClose={close}
        />
      )}
    </div>
  )
}

export default AddressBookDemo
