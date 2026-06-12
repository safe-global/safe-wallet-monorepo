import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

/**
 * Transaction Notes feature allows users to add optional notes to transactions.
 * Notes are publicly visible on-chain and help provide context for transactions.
 *
 * The note input has a 60 character limit and includes a warning about
 * notes being publicly visible.
 *
 * Note: Actual TxNoteInput requires Safe context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/TxNotes',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

const MAX_NOTE_LENGTH = 60

// Mock TxNoteInput component
const MockTxNoteInput = ({ onChange }: { onChange?: (note: string) => void }) => {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')

  const handleChange = (value: string) => {
    const trimmed = value.slice(0, MAX_NOTE_LENGTH)
    setNote(trimmed)
    onChange?.(trimmed)
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger
        render={
          <div className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md py-2">
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            <Typography variant="paragraph-small">Add note (optional)</Typography>
          </div>
        }
      />
      <CollapsibleContent>
        <Field className="mt-2">
          <FieldLabel htmlFor="tx-note">Transaction note</FieldLabel>
          <Textarea
            id="tx-note"
            rows={2}
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={MAX_NOTE_LENGTH}
          />
          <FieldDescription>{`${note.length}/${MAX_NOTE_LENGTH} characters`}</FieldDescription>
        </Field>
        <Alert variant="warning" className="mt-2">
          <AlertDescription>
            Transaction notes are publicly visible on-chain. Do not include sensitive information.
          </AlertDescription>
        </Alert>
      </CollapsibleContent>
    </Collapsible>
  )
}

// TxNoteInput - Basic
const TxNoteInputWrapper = () => {
  const [note, setNote] = useState('')

  return (
    <div className="bg-background max-w-[450px] rounded-lg p-6">
      <MockTxNoteInput onChange={setNote} />
      {note && (
        <div className="bg-muted mt-4 rounded-md p-4">
          <Typography variant="paragraph-mini" color="muted">
            Current note:
          </Typography>
          <Typography variant="paragraph-small">{note}</Typography>
        </div>
      )}
    </div>
  )
}

// FULL PAGE FIRST - Multiple notes in transaction history
export const NotesInHistory: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[600px] rounded-lg p-6">
      <Typography variant="h4" className="mb-4">
        Transaction history with notes
      </Typography>

      <div className="flex flex-col gap-4">
        {[
          { amount: '1.5 ETH', to: '0x1234...5678', note: 'Monthly payroll' },
          { amount: '500 USDC', to: '0xABCD...EFGH', note: 'Marketing campaign budget' },
          { amount: '0.1 ETH', to: '0x9876...5432', note: null },
        ].map((tx, index) => (
          <div key={index} className="rounded-md border border-border p-4">
            <div className="mb-2 flex justify-between">
              <Typography variant="paragraph-bold">{tx.amount}</Typography>
              <Typography variant="paragraph-mini" color="muted">
                To: {tx.to}
              </Typography>
            </div>
            {tx.note ? (
              <Typography variant="paragraph-small" color="muted" className="bg-muted rounded-sm p-2">
                📝 {tx.note}
              </Typography>
            ) : (
              <Typography variant="paragraph-mini" color="muted" className="italic">
                No note added
              </Typography>
            )}
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transaction history showing transactions with and without notes.',
      },
    },
  },
}

export const NoteInput: StoryObj = {
  render: () => <TxNoteInputWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'TxNoteInput allows users to add an optional note to a transaction. Limited to 60 characters.',
      },
    },
  },
}

// TxNoteInput - In context of transaction form
export const NoteInTransactionForm: StoryObj = {
  render: () => {
    const [_note, setNote] = useState('')

    return (
      <div className="bg-background max-w-[500px] rounded-lg p-6">
        <Typography variant="h4" className="mb-4">
          Transaction details
        </Typography>

        <div className="bg-muted mb-6 rounded-md p-4">
          <Typography variant="paragraph-small" color="muted">
            Sending
          </Typography>
          <Typography variant="h4">1.5 ETH</Typography>
          <Typography variant="paragraph-small" color="muted">
            To: 0x1234...5678
          </Typography>
        </div>

        <MockTxNoteInput onChange={setNote} />

        <div className="mt-6 flex justify-end gap-4">
          <Typography variant="paragraph-small-medium" color="muted" className="mr-auto">
            Cancel
          </Typography>
          <Typography variant="paragraph-small-medium" className="text-primary">
            Continue
          </Typography>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'TxNoteInput shown in context of a transaction confirmation form.',
      },
    },
  },
}

// Display of existing note
export const DisplayedNote: StoryObj = {
  render: () => (
    <div className="bg-background max-w-[500px] rounded-lg p-6">
      <Typography variant="paragraph-small-bold" color="muted" className="mb-4 block">
        Transaction note
      </Typography>
      <div className="bg-muted rounded-md border border-border p-4">
        <Typography variant="paragraph-small">
          Monthly payroll for engineering team - Q1 2024 budget allocation
        </Typography>
      </div>
      <Typography variant="paragraph-mini" color="muted" className="mt-2 block">
        Added by owner 0x1234...5678
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'How a transaction note appears when viewing transaction details.',
      },
    },
  },
}

// Note character limit reached
export const NoteCharacterLimit: StoryObj = {
  render: () => {
    const [note, setNote] = useState('This is a very long note that reaches the character limit!')

    return (
      <div className="bg-background max-w-[450px] rounded-lg p-6">
        <Field data-invalid={note.length === MAX_NOTE_LENGTH}>
          <FieldLabel htmlFor="tx-note-limit">Transaction note</FieldLabel>
          <Textarea
            id="tx-note-limit"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
            maxLength={MAX_NOTE_LENGTH}
            aria-invalid={note.length === MAX_NOTE_LENGTH}
          />
          <FieldDescription>{`${note.length}/${MAX_NOTE_LENGTH} characters`}</FieldDescription>
        </Field>
        <Alert variant="warning" className="mt-2">
          <AlertDescription>
            Transaction notes are publicly visible on-chain. Do not include sensitive information.
          </AlertDescription>
        </Alert>
        <Typography variant="paragraph-mini" className="mt-2 block text-[var(--color-warning-main)]">
          Note is at or near the 60 character limit
        </Typography>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'TxNoteInput showing character count near the limit.',
      },
    },
  },
}
