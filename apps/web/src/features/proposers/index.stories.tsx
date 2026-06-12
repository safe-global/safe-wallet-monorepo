import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { UserPlus, Pencil, Trash2 } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

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
  <Chip variant="outline" className="gap-1 text-[var(--color-warning-main)]">
    <UserPlus className="size-3" />
    Proposed
  </Chip>
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
  <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
    <DialogContent className="max-w-[320px]">
      <DialogHeader>
        <DialogTitle>Remove proposer</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2 px-4">
        <Typography variant="paragraph-small">
          Are you sure you want to remove <strong>{proposer.name}</strong> as a proposer?
        </Typography>
        <Typography variant="paragraph-mini" color="muted">
          {proposer.address}
        </Typography>
        <Typography variant="paragraph-small" color="muted">
          This will prevent them from creating new transaction proposals.
        </Typography>
      </div>
      <DialogFooter className="flex-row justify-end">
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
  <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit proposer</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-4">
        <Field>
          <FieldLabel htmlFor="proposer-name">Name</FieldLabel>
          <Input id="proposer-name" defaultValue={proposer.name} />
        </Field>
        <Field>
          <FieldLabel htmlFor="proposer-address">Address</FieldLabel>
          <Input id="proposer-address" defaultValue={proposer.address} disabled />
          <FieldDescription>Address cannot be changed</FieldDescription>
        </Field>
      </div>
      <DialogFooter className="flex-row justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

// Stories - FULL PAGE FIRST

export const ProposersList: StoryObj = {
  render: () => {
    const [editProposer, setEditProposer] = useState<(typeof mockProposers)[0] | null>(null)
    const [deleteProposer, setDeleteProposer] = useState<(typeof mockProposers)[0] | null>(null)

    return (
      <div className="bg-background max-w-[600px] rounded-lg p-6">
        <Typography variant="h4" className="mb-2">
          Proposers
        </Typography>
        <Typography variant="paragraph-small" color="muted" className="mb-6">
          Proposers can create transactions but cannot sign them. Owners must approve or reject.
        </Typography>

        <div className="flex flex-col gap-4">
          {mockProposers.map((proposer, index) => (
            <div key={index} className="flex items-center justify-between rounded-md border border-border p-4">
              <div>
                <Typography variant="paragraph">{proposer.name}</Typography>
                <Typography variant="paragraph-mini" color="muted">
                  {proposer.address.slice(0, 10)}...{proposer.address.slice(-8)}
                </Typography>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditProposer(proposer)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[var(--color-error-main)]"
                  onClick={() => setDeleteProposer(proposer)}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button className="mt-6">
          <UserPlus className="size-4" />
          Add proposer
        </Button>

        {editProposer && <MockEditDialog open={true} onClose={() => setEditProposer(null)} proposer={editProposer} />}
        {deleteProposer && (
          <MockDeleteDialog open={true} onClose={() => setDeleteProposer(null)} proposer={deleteProposer} />
        )}
      </div>
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
    <div className="bg-background rounded-lg p-6">
      <Typography variant="paragraph-small-bold" className="mb-2 block">
        Transaction proposal chip
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-4">
        This chip appears on transactions created by proposers (non-owners).
      </Typography>
      <MockTxProposalChip />
    </div>
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
    <div className="bg-background max-w-[500px] rounded-lg p-4">
      <div className="flex items-center justify-between border-b border-border p-2">
        <div>
          <Typography variant="paragraph-small">Send 1.5 ETH</Typography>
          <Typography variant="paragraph-mini" color="muted">
            To: 0x1234...5678
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <MockTxProposalChip />
          <Typography variant="paragraph-mini" className="text-[var(--color-warning-main)]">
            Awaiting confirmation
          </Typography>
        </div>
      </div>
    </div>
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
        <Button variant="outline" className="text-[var(--color-error-main)]" onClick={() => setOpen(true)}>
          Open delete dialog
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
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open edit dialog
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
      <div className="flex flex-col items-start gap-4">
        <Typography variant="h4">Proposer management dialogs</Typography>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setDialog('edit')}>
            Edit proposer
          </Button>
          <Button variant="outline" className="text-[var(--color-error-main)]" onClick={() => setDialog('delete')}>
            Delete proposer
          </Button>
        </div>

        <MockEditDialog open={dialog === 'edit'} onClose={() => setDialog(null)} proposer={mockProposers[0]} />
        <MockDeleteDialog open={dialog === 'delete'} onClose={() => setDialog(null)} proposer={mockProposers[0]} />
      </div>
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
    <div className="bg-background max-w-[600px] rounded-lg p-6 text-center">
      <Typography variant="h4" className="mb-2">
        Proposers
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6">
        No proposers have been added yet.
      </Typography>
      <Typography variant="paragraph-small" color="muted" className="mb-6">
        Proposers can create transaction proposals without having signing authority. This is useful for operational
        workflows.
      </Typography>
      <Button>
        <UserPlus className="size-4" />
        Add proposer
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no proposers have been added.',
      },
    },
  },
}
