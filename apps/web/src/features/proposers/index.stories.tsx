import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

/**
 * Proposers feature allows non-owners to propose transactions for a Safe.
 * Proposers can create transactions but cannot sign them - owners must
 * review and confirm/reject proposed transactions.
 *
 * This is useful for operational workflows where team members need to
 * suggest transactions without having signing authority.
 *
 * Note: Actual components require Redux store and wallet context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/Proposers',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Mock proposer data
const mockProposers = [
  { name: 'Operations Team', address: '0x1234567890123456789012345678901234567890' },
  { name: 'Finance Bot', address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01' },
  { name: 'Dev Automation', address: '0x9876543210987654321098765432109876543210' },
]

// Mock TxProposalChip
const MockTxProposalChip = () => (
  <Chip label="Proposed" size="small" color="warning" variant="outlined" icon={<PersonAddIcon fontSize="small" />} />
)

// Mock DeleteProposerDialog
const MockDeleteDialog = ({
  open,
  onClose,
  proposer,
}: {
  open: boolean
  onClose: () => void
  proposer: { name: string; address: string }
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Remove Proposer</DialogTitle>
    <DialogContent>
      <Typography variant="body2">
        Are you sure you want to remove <strong>{proposer.name}</strong> as a proposer?
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {proposer.address}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        This will prevent them from creating new transaction proposals.
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

// Mock EditProposerDialog
const MockEditDialog = ({
  open,
  onClose,
  proposer,
}: {
  open: boolean
  onClose: () => void
  proposer: { name: string; address: string }
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Edit Proposer</DialogTitle>
    <DialogContent>
      <TextField label="Name" fullWidth defaultValue={proposer.name} margin="normal" />
      <TextField
        label="Address"
        fullWidth
        defaultValue={proposer.address}
        margin="normal"
        disabled
        helperText="Address cannot be changed"
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onClose}>
        Save
      </Button>
    </DialogActions>
  </Dialog>
)

// Stories - FULL PAGE FIRST

export const ProposersList: StoryObj = {
  render: () => {
    const [editProposer, setEditProposer] = useState<(typeof mockProposers)[0] | null>(null)
    const [deleteProposer, setDeleteProposer] = useState<(typeof mockProposers)[0] | null>(null)

    return (
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Proposers
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Proposers can create transactions but cannot sign them. Owners must approve or reject.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mockProposers.map((proposer, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="body1">{proposer.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {proposer.address.slice(0, 10)}...{proposer.address.slice(-8)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<EditIcon fontSize="small" />}
                  onClick={() => setEditProposer(proposer)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  startIcon={<DeleteIcon fontSize="small" />}
                  onClick={() => setDeleteProposer(proposer)}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          ))}
        </Box>

        <Button variant="contained" sx={{ mt: 3 }} startIcon={<PersonAddIcon />}>
          Add Proposer
        </Button>

        {editProposer && <MockEditDialog open={true} onClose={() => setEditProposer(null)} proposer={editProposer} />}
        {deleteProposer && (
          <MockDeleteDialog open={true} onClose={() => setDeleteProposer(null)} proposer={deleteProposer} />
        )}
      </Paper>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Proposers list with management actions.',
      },
    },
  },
}

export const ProposalChip: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="subtitle2" gutterBottom>
        Transaction Proposal Chip
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This chip appears on transactions created by proposers (non-owners).
      </Typography>
      <MockTxProposalChip />
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TxProposalChip indicates that a transaction was created by a proposer and needs owner review.',
      },
    },
  },
}

export const ProposalChipInContext: StoryObj = {
  render: () => (
    <Paper sx={{ p: 2, maxWidth: 500 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="body2">Send 1.5 ETH</Typography>
          <Typography variant="caption" color="text.secondary">
            To: 0x1234...5678
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <MockTxProposalChip />
          <Typography variant="caption" color="warning.main">
            Awaiting confirmation
          </Typography>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TxProposalChip shown in context of a transaction list item.',
      },
    },
  },
}

export const DeleteProposer: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
          Open Delete Dialog
        </Button>
        <MockDeleteDialog open={open} onClose={() => setOpen(false)} proposer={mockProposers[0]} />
      </>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'DeleteProposerDialog confirms removal of a proposer from the Safe.',
      },
    },
  },
}

export const EditProposer: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Open Edit Dialog
        </Button>
        <MockEditDialog open={open} onClose={() => setOpen(false)} proposer={mockProposers[0]} />
      </>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'EditProposerDialog allows changing the label/name of a proposer.',
      },
    },
  },
}

export const AllDialogs: StoryObj = {
  render: () => {
    const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null)

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
        <Typography variant="h6">Proposer Management Dialogs</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => setDialog('edit')}>
            Edit Proposer
          </Button>
          <Button variant="outlined" color="error" onClick={() => setDialog('delete')}>
            Delete Proposer
          </Button>
        </Box>

        <MockEditDialog open={dialog === 'edit'} onClose={() => setDialog(null)} proposer={mockProposers[0]} />
        <MockDeleteDialog open={dialog === 'delete'} onClose={() => setDialog(null)} proposer={mockProposers[0]} />
      </Box>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive showcase of proposer management dialogs.',
      },
    },
  },
}

export const EmptyProposersList: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 600, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Proposers
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        No proposers have been added yet.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Proposers can create transaction proposals without having signing authority. This is useful for operational
        workflows.
      </Typography>
      <Button variant="contained" startIcon={<PersonAddIcon />}>
        Add Proposer
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no proposers have been added.',
      },
    },
  },
}
