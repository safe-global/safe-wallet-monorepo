import type { Meta, StoryObj } from '@storybook/react'
import { Box, Paper, Typography, Button, Chip, LinearProgress } from '@mui/material'
import MessageIcon from '@mui/icons-material/Message'
import DataObjectIcon from '@mui/icons-material/DataObject'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'

/**
 * Safe Messages components handle off-chain message signing for Safe accounts.
 * Messages require threshold signatures before being considered "signed".
 *
 * This includes EIP-191 personal messages and EIP-712 typed data signing.
 *
 * Note: Actual components require Redux store and wallet context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Components/SafeMessages',
  parameters: {
    layout: 'padded',
  },
}

export default meta

// Mock message type component
const MockMsgType = ({ isTypedData = false }: { isTypedData?: boolean }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {isTypedData ? <DataObjectIcon fontSize="small" /> : <MessageIcon fontSize="small" />}
    <Typography variant="body2">{isTypedData ? 'Typed Data (EIP-712)' : 'Personal Message'}</Typography>
  </Box>
)

// Mock message summary row
const MockMsgSummary = ({
  message,
  isTypedData = false,
  confirmations,
  required,
  isConfirmed = false,
}: {
  message: string
  isTypedData?: boolean
  confirmations: number
  required: number
  isConfirmed?: boolean
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 2,
      borderBottom: 1,
      borderColor: 'divider',
      '&:hover': { bgcolor: 'action.hover' },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <MockMsgType isTypedData={isTypedData} />
      <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
        {message}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Chip
        size="small"
        label={`${confirmations}/${required}`}
        color={isConfirmed ? 'success' : 'warning'}
        icon={isConfirmed ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
      />
      {!isConfirmed && (
        <Button variant="contained" size="small">
          Sign
        </Button>
      )}
    </Box>
  </Box>
)

// Mock signers component
const MockMsgSigners = ({
  signers,
  confirmations,
}: {
  signers: { address: string; hasSigned: boolean }[]
  confirmations: number
}) => (
  <Box>
    <Typography variant="subtitle2" gutterBottom>
      Confirmations ({confirmations}/{signers.length} required)
    </Typography>
    <LinearProgress
      variant="determinate"
      value={(confirmations / signers.length) * 100}
      sx={{ mb: 2, height: 8, borderRadius: 1 }}
    />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {signers.map((signer, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: signer.hasSigned ? 'success.light' : 'transparent',
          }}
        >
          <Typography variant="body2" fontFamily="monospace">
            {signer.address.slice(0, 10)}...{signer.address.slice(-8)}
          </Typography>
          {signer.hasSigned ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : (
            <Typography variant="caption" color="text.secondary">
              Pending
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  </Box>
)

// Stories - FULL PAGE FIRST

export const FullMessagePage: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View and sign off-chain messages for your Safe account.
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1">Pending Messages</Typography>
        </Box>
        <MockMsgSummary message="Hello, Safe!" confirmations={1} required={2} />
        <MockMsgSummary
          message='{"types":{"Permit":[...]},"domain":{...}}'
          isTypedData
          confirmations={0}
          required={2}
        />
      </Paper>

      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1">Signed Messages</Typography>
        </Box>
        <MockMsgSummary message="Contract agreement signed" confirmations={2} required={2} isConfirmed />
      </Paper>
    </Box>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Full messages page layout with pending and signed messages.',
      },
    },
  },
}

export const MessageType: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Personal Message
        </Typography>
        <MockMsgType />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Typed Data (EIP-712)
        </Typography>
        <MockMsgType isTypedData />
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'MsgType displays the message type icon and label.',
      },
    },
  },
}

export const MessageSummary: StoryObj = {
  render: () => (
    <Paper sx={{ maxWidth: 800 }}>
      <Typography variant="subtitle2" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        Message Queue
      </Typography>
      <MockMsgSummary message="Hello, Safe!" confirmations={1} required={2} />
      <MockMsgSummary message='{"types":{"Permit":[...]},"domain":{...}}' isTypedData confirmations={1} required={2} />
      <MockMsgSummary message="Signed agreement for contract XYZ" confirmations={2} required={2} isConfirmed />
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'MsgSummary displays message row with type, confirmations, status, and action button.',
      },
    },
  },
}

export const MessageSigners: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <MockMsgSigners
        confirmations={1}
        signers={[
          { address: '0x1234567890123456789012345678901234567890', hasSigned: true },
          { address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01', hasSigned: false },
        ]}
      />
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'MsgSigners displays the list of signers with confirmation status.',
      },
    },
  },
}

export const SignButton: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, display: 'flex', gap: 2 }}>
      <Box>
        <Typography variant="caption" display="block" mb={1}>
          Full Button
        </Typography>
        <Button variant="contained">Sign Message</Button>
      </Box>
      <Box>
        <Typography variant="caption" display="block" mb={1}>
          Compact Button
        </Typography>
        <Button variant="contained" size="small">
          Sign
        </Button>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'SignMsgButton in full and compact variants.',
      },
    },
  },
}

export const MessageInfoBox: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, border: 1, borderColor: 'info.main' }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Message Signing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is an off-chain message that will be signed by your Safe. No transaction will be executed.
        </Typography>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'InfoBox displays informational content with title and message.',
      },
    },
  },
}

export const DecodedMessage: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="subtitle2" gutterBottom>
        Personal Message
      </Typography>
      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 3 }}>
        <Typography variant="body2" fontFamily="monospace">
          Hello, this is a test message!
        </Typography>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Typed Data (EIP-712)
      </Typography>
      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Domain: USD Coin
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Primary Type: Permit
        </Typography>
        <Box sx={{ mt: 1 }}>
          <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(
              {
                owner: '0x1234...5678',
                spender: '0xABCD...EF01',
                value: '1000000000',
                nonce: 0,
              },
              null,
              2,
            )}
          </pre>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'DecodedMsg displays the message content in a readable format.',
      },
    },
  },
}
