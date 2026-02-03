import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Box, Paper, Typography, TextField, Collapse, Alert } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

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
    <Box>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          py: 1,
          '&:hover': { bgcolor: 'action.hover' },
          borderRadius: 1,
        }}
      >
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        <Typography variant="body2">Add note (optional)</Typography>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ mt: 1 }}>
          <TextField
            label="Transaction note"
            multiline
            rows={2}
            fullWidth
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            helperText={`${note.length}/${MAX_NOTE_LENGTH} characters`}
            inputProps={{ maxLength: MAX_NOTE_LENGTH }}
          />
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="caption">
              Transaction notes are publicly visible on-chain. Do not include sensitive information.
            </Typography>
          </Alert>
        </Box>
      </Collapse>
    </Box>
  )
}

// TxNoteInput - Basic
const TxNoteInputWrapper = () => {
  const [note, setNote] = useState('')

  return (
    <Paper sx={{ p: 3, maxWidth: 450 }}>
      <MockTxNoteInput onChange={setNote} />
      {note && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Current note:
          </Typography>
          <Typography variant="body2">{note}</Typography>
        </Box>
      )}
    </Paper>
  )
}

// FULL PAGE FIRST - Multiple notes in transaction history
export const NotesInHistory: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Transaction History with Notes
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { amount: '1.5 ETH', to: '0x1234...5678', note: 'Monthly payroll' },
          { amount: '500 USDC', to: '0xABCD...EFGH', note: 'Marketing campaign budget' },
          { amount: '0.1 ETH', to: '0x9876...5432', note: null },
        ].map((tx, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" fontWeight="bold">
                {tx.amount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                To: {tx.to}
              </Typography>
            </Box>
            {tx.note ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  p: 1,
                  bgcolor: 'background.default',
                  borderRadius: 0.5,
                }}
              >
                📝 {tx.note}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                No note added
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
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
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <Typography variant="h6" gutterBottom>
          Transaction Details
        </Typography>

        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Sending
          </Typography>
          <Typography variant="h5">1.5 ETH</Typography>
          <Typography variant="body2" color="text.secondary">
            To: 0x1234...5678
          </Typography>
        </Box>

        <MockTxNoteInput onChange={setNote} />

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Typography variant="button" color="text.secondary" sx={{ mr: 'auto' }}>
            Cancel
          </Typography>
          <Typography variant="button" color="primary">
            Continue
          </Typography>
        </Box>
      </Paper>
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
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Transaction Note
      </Typography>
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.default',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2">Monthly payroll for engineering team - Q1 2024 budget allocation</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Added by owner 0x1234...5678
      </Typography>
    </Paper>
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
      <Paper sx={{ p: 3, maxWidth: 450 }}>
        <Box>
          <TextField
            label="Transaction note"
            multiline
            rows={2}
            fullWidth
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
            helperText={`${note.length}/${MAX_NOTE_LENGTH} characters`}
            inputProps={{ maxLength: MAX_NOTE_LENGTH }}
            error={note.length === MAX_NOTE_LENGTH}
          />
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="caption">
              Transaction notes are publicly visible on-chain. Do not include sensitive information.
            </Typography>
          </Alert>
        </Box>
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
          Note is at or near the 60 character limit
        </Typography>
      </Paper>
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
