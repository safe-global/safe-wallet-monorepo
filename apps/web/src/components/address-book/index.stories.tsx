import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import UploadIcon from '@mui/icons-material/Upload'
import DownloadIcon from '@mui/icons-material/Download'

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
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>{isEdit ? 'Edit entry' : 'Create entry'}</DialogTitle>
    <DialogContent>
      <TextField
        label="Name"
        fullWidth
        defaultValue={defaultValues?.name || ''}
        margin="normal"
        placeholder="Enter a name for this address"
      />
      <TextField
        label="Address"
        fullWidth
        defaultValue={defaultValues?.address || ''}
        margin="normal"
        placeholder="0x..."
        disabled={isEdit}
        helperText={isEdit ? 'Address cannot be changed' : ''}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onClose}>
        {isEdit ? 'Save' : 'Add'}
      </Button>
    </DialogActions>
  </Dialog>
)

// Mock ImportDialog
const MockImportDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Import address book</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload a CSV file with addresses and names. The file should have two columns: address and name.
      </Typography>
      <Box
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderColor: 'divider',
          borderRadius: 1,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2">Drop your CSV file here or click to browse</Typography>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onClose}>
        Import
      </Button>
    </DialogActions>
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
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Remove entry</DialogTitle>
    <DialogContent>
      <Typography variant="body2">
        Are you sure you want to remove <strong>{name}</strong> from your address book?
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {address}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" color="error" onClick={onClose}>
        Remove
      </Button>
    </DialogActions>
  </Dialog>
)

// Mock AddressBookHeader
const MockAddressBookHeader = ({ onAdd, onImport }: { onAdd?: () => void; onImport?: () => void }) => (
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
    <TextField
      size="small"
      placeholder="Search by name or address"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
      sx={{ flex: 1, minWidth: 200 }}
    />
    <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
      Create entry
    </Button>
    <Button variant="outlined" startIcon={<UploadIcon />} onClick={onImport}>
      Import
    </Button>
    <Button variant="outlined" startIcon={<DownloadIcon />}>
      Export
    </Button>
  </Box>
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
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No entries in your address book
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Add addresses you use frequently for easy access
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer>
      <MuiTable>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Address</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.address} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {entry.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => onEdit?.(entry)} title="Edit">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete?.(entry)} title="Delete" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
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
      <Box sx={{ width: 900 }}>
        <Typography variant="h4" gutterBottom>
          Address Book
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Save frequently used addresses for easy access across the app.
        </Typography>
        <Paper sx={{ p: 2 }}>
          <MockAddressBookHeader onAdd={() => setCreateOpen(true)} onImport={() => setImportOpen(true)} />
          <Box sx={{ mt: 2 }}>
            <MockAddressBookTable entries={mockEntries} onEdit={setEditEntry} onDelete={setDeleteEntry} />
          </Box>
        </Paper>

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
      </Box>
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
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open Create Dialog
        </Button>
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
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open Edit Dialog
        </Button>
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
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open Import Dialog
        </Button>
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
        <Button variant="contained" color="error" onClick={() => setOpen(true)}>
          Open Remove Dialog
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
    <Paper sx={{ p: 2, width: 700 }}>
      <MockAddressBookHeader />
    </Paper>
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
    <Paper sx={{ width: 800 }}>
      <MockAddressBookTable entries={mockEntries} />
    </Paper>
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
    <Paper sx={{ width: 800 }}>
      <MockAddressBookTable entries={[]} />
    </Paper>
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
        <Typography variant="h6">Address Book Dialogs</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => setDialog('create')}>
            Create Entry
          </Button>
          <Button variant="outlined" onClick={() => setDialog('edit')}>
            Edit Entry
          </Button>
          <Button variant="outlined" onClick={() => setDialog('import')}>
            Import CSV
          </Button>
          <Button variant="outlined" color="error" onClick={() => setDialog('remove')}>
            Remove Entry
          </Button>
        </Box>

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
      </Box>
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
