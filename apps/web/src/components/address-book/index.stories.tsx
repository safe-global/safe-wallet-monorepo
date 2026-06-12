import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Pencil, Trash2, Search, Plus, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/**
 * Address Book components allow users to save and manage frequently used
 * addresses with custom names. This improves UX by showing recognizable
 * names instead of long hex addresses throughout the app.
 *
 * Note: Actual components require Redux store context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Components/AddressBook',
  parameters: {
    layout: 'centered',
  },
}

export default meta

// Mock address book entries
const mockEntries = [
  { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', name: 'Vitalik' },
  { address: '0x1234567890123456789012345678901234567890', name: 'My Wallet' },
  { address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01', name: 'Treasury' },
  { address: '0x9876543210987654321098765432109876543210', name: 'Exchange Hot Wallet' },
]

// Mock EntryDialog
const MockEntryDialog = ({
  open,
  onClose,
  defaultValues,
  isEdit,
}: {
  open: boolean
  onClose: () => void
  defaultValues?: { name: string; address: string }
  isEdit?: boolean
}) => (
  <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit entry' : 'Create entry'}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-4">
        <Field>
          <FieldLabel htmlFor="entry-name">Name</FieldLabel>
          <Input id="entry-name" defaultValue={defaultValues?.name || ''} placeholder="Enter a name for this address" />
        </Field>
        <Field>
          <FieldLabel htmlFor="entry-address">Address</FieldLabel>
          <Input id="entry-address" defaultValue={defaultValues?.address || ''} placeholder="0x..." disabled={isEdit} />
          {isEdit && <FieldDescription>Address cannot be changed</FieldDescription>}
        </Field>
      </div>
      <DialogFooter className="sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>{isEdit ? 'Save' : 'Add'}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Mock ImportDialog
const MockImportDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Import address book</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <Typography variant="paragraph-small" color="muted">
          Upload a CSV file with addresses and names. The file should have two columns: address and name.
        </Typography>
        <div className="border-border hover:bg-muted flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-8 text-center">
          <Upload className="text-muted-foreground size-12" />
          <Typography variant="paragraph-small">Drop your CSV file here or click to browse</Typography>
        </div>
      </div>
      <DialogFooter className="sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>Import</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Mock RemoveDialog
const MockRemoveDialog = ({
  open,
  onClose,
  address,
  name,
}: {
  open: boolean
  onClose: () => void
  address: string
  name: string
}) => (
  <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
    <DialogContent className="sm:max-w-xs">
      <DialogHeader>
        <DialogTitle>Remove entry</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2 px-4 pb-4">
        <Typography variant="paragraph-small">
          Are you sure you want to remove <strong>{name}</strong> from your address book?
        </Typography>
        <Typography variant="paragraph-mini" color="muted" className="block">
          {address}
        </Typography>
      </div>
      <DialogFooter className="sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onClose}>
          Remove
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Mock AddressBookHeader
const MockAddressBookHeader = ({ onAdd, onImport }: { onAdd?: () => void; onImport?: () => void }) => (
  <div className="flex flex-wrap items-center gap-4">
    <InputGroup className="min-w-[200px] flex-1">
      <InputGroupAddon align="inline-start">
        <Search />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search by name or address" />
    </InputGroup>
    <Button onClick={onAdd}>
      <Plus />
      Create entry
    </Button>
    <Button variant="outline" onClick={onImport}>
      <Upload />
      Import
    </Button>
    <Button variant="outline">
      <Download />
      Export
    </Button>
  </div>
)

// Mock AddressBookTable
const MockAddressBookTable = ({
  entries,
  onEdit,
  onDelete,
}: {
  entries: typeof mockEntries
  onEdit?: (entry: (typeof mockEntries)[0]) => void
  onDelete?: (entry: (typeof mockEntries)[0]) => void
}) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-8 text-center">
        <Typography color="muted">No entries in your address book</Typography>
        <Typography variant="paragraph-small" color="muted">
          Add addresses you use frequently for easy access
        </Typography>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.address}>
            <TableCell>
              <Typography variant="paragraph-small-bold">{entry.name}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="paragraph-small" className="font-mono">
                {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
              </Typography>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon-sm" onClick={() => onEdit?.(entry)} title="Edit">
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onDelete?.(entry)} title="Delete">
                <Trash2 />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Stories - FULL PAGE FIRST

export const FullPage: StoryObj = {
  render: () => {
    const [createOpen, setCreateOpen] = useState(false)
    const [importOpen, setImportOpen] = useState(false)
    const [editEntry, setEditEntry] = useState<(typeof mockEntries)[0] | null>(null)
    const [deleteEntry, setDeleteEntry] = useState<(typeof mockEntries)[0] | null>(null)

    return (
      <div className="w-[900px]">
        <Typography variant="h4" className="mb-2">
          Address book
        </Typography>
        <Typography variant="paragraph-small" color="muted" className="mb-6">
          Save frequently used addresses for easy access across the app.
        </Typography>
        <div className="rounded-lg bg-[var(--color-background-paper)] p-4">
          <MockAddressBookHeader onAdd={() => setCreateOpen(true)} onImport={() => setImportOpen(true)} />
          <div className="mt-4">
            <MockAddressBookTable entries={mockEntries} onEdit={setEditEntry} onDelete={setDeleteEntry} />
          </div>
        </div>

        <MockEntryDialog open={createOpen} onClose={() => setCreateOpen(false)} />
        <MockImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
        {editEntry && (
          <MockEntryDialog open={true} onClose={() => setEditEntry(null)} defaultValues={editEntry} isEdit />
        )}
        {deleteEntry && (
          <MockRemoveDialog
            open={true}
            onClose={() => setDeleteEntry(null)}
            address={deleteEntry.address}
            name={deleteEntry.name}
          />
        )}
      </div>
    )
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Full address book page layout with header and table.',
      },
    },
  },
}

export const CreateEntry: StoryObj = {
  tags: ['!chromatic'],
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open create dialog</Button>
        <MockEntryDialog open={open} onClose={() => setOpen(false)} />
      </>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'EntryDialog for creating a new address book entry with name and address inputs.',
      },
    },
  },
}

export const EditEntry: StoryObj = {
  tags: ['!chromatic'],
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open edit dialog</Button>
        <MockEntryDialog
          open={open}
          onClose={() => setOpen(false)}
          defaultValues={{ name: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }}
          isEdit
        />
      </>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'EntryDialog for editing an existing entry. Address input is disabled.',
      },
    },
  },
}

export const ImportEntries: StoryObj = {
  tags: ['!chromatic'],
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open import dialog</Button>
        <MockImportDialog open={open} onClose={() => setOpen(false)} />
      </>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'ImportDialog allows importing address book entries from a CSV file.',
      },
    },
  },
}

export const RemoveEntry: StoryObj = {
  tags: ['!chromatic'],
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Open remove dialog
        </Button>
        <MockRemoveDialog
          open={open}
          onClose={() => setOpen(false)}
          address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
          name="Vitalik"
        />
      </>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'RemoveDialog confirms deletion of an address book entry.',
      },
    },
  },
}

export const Header: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <div className="w-[700px] rounded-lg bg-[var(--color-background-paper)] p-4">
      <MockAddressBookHeader />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'AddressBookHeader with search input and action buttons.',
      },
    },
  },
}

export const AddressTable: StoryObj = {
  render: () => (
    <div className="w-[800px] rounded-lg bg-[var(--color-background-paper)]">
      <MockAddressBookTable entries={mockEntries} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'AddressBookTable displays all saved addresses with edit and delete actions.',
      },
    },
  },
}

export const EmptyTable: StoryObj = {
  render: () => (
    <div className="w-[800px] rounded-lg bg-[var(--color-background-paper)]">
      <MockAddressBookTable entries={[]} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'AddressBookTable with no entries shows empty state.',
      },
    },
  },
}

export const AllDialogs: StoryObj = {
  tags: ['!chromatic'],
  render: () => {
    const [dialog, setDialog] = useState<'create' | 'edit' | 'import' | 'remove' | null>(null)

    return (
      <div className="flex flex-col items-start gap-4">
        <Typography variant="h4">Address book dialogs</Typography>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => setDialog('create')}>
            Create entry
          </Button>
          <Button variant="outline" onClick={() => setDialog('edit')}>
            Edit entry
          </Button>
          <Button variant="outline" onClick={() => setDialog('import')}>
            Import CSV
          </Button>
          <Button variant="destructive" onClick={() => setDialog('remove')}>
            Remove entry
          </Button>
        </div>

        <MockEntryDialog open={dialog === 'create'} onClose={() => setDialog(null)} />
        <MockEntryDialog
          open={dialog === 'edit'}
          onClose={() => setDialog(null)}
          defaultValues={{ name: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }}
          isEdit
        />
        <MockImportDialog open={dialog === 'import'} onClose={() => setDialog(null)} />
        <MockRemoveDialog
          open={dialog === 'remove'}
          onClose={() => setDialog(null)}
          address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
          name="Vitalik"
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive showcase of all address book dialogs.',
      },
    },
  },
}
