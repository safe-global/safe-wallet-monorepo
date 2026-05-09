import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Divider,
} from '@mui/material'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import DeleteIcon from '@mui/icons-material/Delete'

/**
 * WalletConnect feature enables connecting Safe accounts to dApps.
 * Users can pair with dApps, approve session proposals, and manage
 * active connections.
 *
 * Key components:
 * - WcConnectionForm: Enter pairing URI
 * - WcProposalForm: Approve/reject dApp connection
 * - WcSessionList: Manage active sessions
 * - WcConnectionState: Connection success/disconnect state
 *
 * Note: Actual components require WalletConnect SDK context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/WalletConnect',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Mock session data
const mockSessions = [
  {
    topic: 'session1',
    name: 'Uniswap',
    url: 'https://app.uniswap.org',
    icon: 'https://app.uniswap.org/favicon.ico',
    chains: ['Ethereum', 'Polygon'],
  },
  {
    topic: 'session2',
    name: 'OpenSea',
    url: 'https://opensea.io',
    icon: 'https://opensea.io/favicon.ico',
    chains: ['Ethereum'],
  },
  {
    topic: 'session3',
    name: 'Aave',
    url: 'https://app.aave.com',
    icon: 'https://app.aave.com/favicon.ico',
    chains: ['Ethereum', 'Arbitrum'],
  },
]

// Mock proposal data
const mockProposal = {
  name: 'Example dApp',
  url: 'https://example.com',
  icon: null,
  description: 'A decentralized application for managing assets',
  chains: ['Ethereum'],
  methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData'],
}

// Mock WcLogoHeader
const MockWcLogoHeader = ({ error }: { error?: string }) => (
  <Box sx={{ textAlign: 'center', mb: 3 }}>
    <Box
      sx={{
        width: 60,
        height: 60,
        bgcolor: 'primary.main',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 'auto',
        mb: 2,
      }}
    >
      <LinkIcon sx={{ color: 'white', fontSize: 32 }} />
    </Box>
    <Typography variant="h6">WalletConnect</Typography>
    {error && (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    )}
  </Box>
)

// Docs-style wrapper for each state
const StateWrapper = ({
  stateName,
  description,
  children,
}: {
  stateName: string
  description: string
  children: React.ReactNode
}) => (
  <Box sx={{ mb: 8 }}>
    <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h5">{stateName}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>{children}</Box>
  </Box>
)

// All States - Scrollable view of entire WalletConnect flow
export const WalletConnectAllStates: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: 550 }}>
        <Box sx={{ mb: 6, pb: 3, borderBottom: '2px solid', borderColor: 'primary.main' }}>
          <Typography variant="h4">WalletConnect Flow</Typography>
          <Typography variant="body1" color="text.secondary">
            Complete walkthrough of the WalletConnect connection process. Scroll to view each state.
          </Typography>
        </Box>

        {/* State 1: Empty - No Sessions */}
        <StateWrapper
          stateName="Initial State (No Sessions)"
          description="User sees the connection form with no active sessions."
        >
          <Paper sx={{ p: 3, maxWidth: 400 }}>
            <MockWcLogoHeader />
            <TextField fullWidth placeholder="Paste pairing code or URI" sx={{ mb: 3 }} />
            <Button variant="contained" fullWidth disabled sx={{ mb: 3 }}>
              Connect
            </Button>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No active sessions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Connect to a dApp to get started
              </Typography>
            </Box>
          </Paper>
        </StateWrapper>

        {/* State 2: Connection Proposal */}
        <StateWrapper
          stateName="Connection Proposal"
          description="A dApp requests to connect. User reviews permissions before approving."
        >
          <Paper sx={{ p: 3, maxWidth: 450 }}>
            <Typography variant="h6" gutterBottom>
              Connection request
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 48, height: 48 }}>{mockProposal.name[0]}</Avatar>
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {mockProposal.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {mockProposal.url}
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              {mockProposal.name} wants to connect to your Safe
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Requested permissions
            </Typography>
            <Box sx={{ mb: 2 }}>
              {mockProposal.methods.map((method) => (
                <Chip key={method} label={method} size="small" sx={{ mr: 0.5, mb: 0.5 }} variant="outlined" />
              ))}
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Networks
            </Typography>
            <Box sx={{ mb: 3 }}>
              {mockProposal.chains.map((chain) => (
                <Chip key={chain} label={chain} size="small" sx={{ mr: 0.5 }} />
              ))}
            </Box>

            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="I understand the risks of connecting"
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" fullWidth>
                Reject
              </Button>
              <Button variant="contained" fullWidth>
                Approve
              </Button>
            </Box>
          </Paper>
        </StateWrapper>

        {/* State 3: Connected */}
        <StateWrapper
          stateName="Connected Successfully"
          description="Connection established. User sees confirmation with linked accounts."
        >
          <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Connected
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, my: 3 }}>
              <Avatar>S</Avatar>
              <LinkIcon color="success" />
              <Avatar>{mockSessions[0].name[0]}</Avatar>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Your Safe is now connected to {mockSessions[0].name}
            </Typography>
          </Paper>
        </StateWrapper>

        {/* State 4: Active Sessions */}
        <StateWrapper
          stateName="Active Sessions"
          description="User can view and manage all active WalletConnect sessions."
        >
          <Paper sx={{ p: 3, maxWidth: 450 }}>
            <MockWcLogoHeader />
            <TextField fullWidth placeholder="Paste pairing code or URI" defaultValue="" sx={{ mb: 3 }} />
            <Button variant="contained" fullWidth disabled sx={{ mb: 3 }}>
              Connect
            </Button>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Active sessions ({mockSessions.length})
            </Typography>
            <List>
              {mockSessions.map((session) => (
                <ListItem key={session.topic} sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={session.icon}>{session.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={session.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {session.chains.map((chain) => (
                          <Chip key={chain} label={chain} size="small" />
                        ))}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" color="error">
                      <LinkOffIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </StateWrapper>

        {/* State 5: Disconnected */}
        <StateWrapper stateName="Disconnected" description="Confirmation shown when a session is disconnected.">
          <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
            <LinkOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Disconnected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mockSessions[0].name} has been disconnected from your Safe.
            </Typography>
          </Paper>
        </StateWrapper>

        {/* State 6: Error */}
        <StateWrapper
          stateName="Error State"
          description="Shown when connection fails due to invalid URI or network error."
        >
          <Paper sx={{ p: 3, maxWidth: 400 }}>
            <MockWcLogoHeader error="Connection failed" />
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to connect: Invalid pairing URI
            </Alert>
            <TextField
              fullWidth
              placeholder="Paste pairing code or URI"
              error
              defaultValue="invalid-uri"
              sx={{ mb: 2 }}
            />
            <Button variant="contained" fullWidth>
              Try again
            </Button>
          </Paper>
        </StateWrapper>
      </Box>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'All states of the WalletConnect flow displayed vertically for easy review.',
      },
    },
  },
}

// Full page first - WalletConnect Main UI
export const FullWalletConnectUI: StoryObj = {
  render: () => {
    const [uri, setUri] = useState('')

    return (
      <Paper sx={{ p: 3, maxWidth: 450 }}>
        <MockWcLogoHeader />

        <TextField
          fullWidth
          placeholder="Paste pairing code or URI"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setUri('wc:example...')}>
                  <ContentPasteIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        <Button variant="contained" fullWidth disabled={!uri} sx={{ mb: 3 }}>
          Connect
        </Button>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Active sessions ({mockSessions.length})
        </Typography>

        <List>
          {mockSessions.map((session) => (
            <ListItem key={session.topic} sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
              <ListItemAvatar>
                <Avatar src={session.icon}>{session.name[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={session.name}
                secondary={
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {session.chains.map((chain) => (
                      <Chip key={chain} label={chain} size="small" />
                    ))}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" color="error">
                  <LinkOffIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">How to connect</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              1. Open a WalletConnect-compatible dApp
              <br />
              2. Click &quot;Connect Wallet&quot; and select WalletConnect
              <br />
              3. Copy the pairing code and paste it here
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Full WalletConnect UI with connection form and active sessions.',
      },
    },
  },
}

// Connection Form
export const ConnectionForm: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <MockWcLogoHeader />

      <TextField
        fullWidth
        placeholder="Paste pairing code or URI"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton>
                <ContentPasteIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <Button variant="contained" fullWidth disabled>
        Connect
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WalletConnect pairing URI input form.',
      },
    },
  },
}

// Proposal Form
export const ProposalForm: StoryObj = {
  render: () => {
    const [accepted, setAccepted] = useState(false)

    return (
      <Paper sx={{ p: 3, maxWidth: 450 }}>
        <Typography variant="h6" gutterBottom>
          Connection request
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ width: 48, height: 48 }}>{mockProposal.name[0]}</Avatar>
          <Box>
            <Typography variant="body1" fontWeight="bold">
              {mockProposal.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {mockProposal.url}
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          {mockProposal.name} wants to connect to your Safe
        </Alert>

        <Typography variant="subtitle2" gutterBottom>
          Requested permissions
        </Typography>
        <Box sx={{ mb: 2 }}>
          {mockProposal.methods.map((method) => (
            <Chip key={method} label={method} size="small" sx={{ mr: 0.5, mb: 0.5 }} variant="outlined" />
          ))}
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Networks
        </Typography>
        <Box sx={{ mb: 3 }}>
          {mockProposal.chains.map((chain) => (
            <Chip key={chain} label={chain} size="small" sx={{ mr: 0.5 }} />
          ))}
        </Box>

        <FormControlLabel
          control={<Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />}
          label="I understand the risks of connecting"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" fullWidth>
            Reject
          </Button>
          <Button variant="contained" fullWidth disabled={!accepted}>
            Approve
          </Button>
        </Box>
      </Paper>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'dApp connection proposal approval form.',
      },
    },
  },
}

// Session List
export const SessionList: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        Active sessions
      </Typography>

      <List>
        {mockSessions.map((session) => (
          <ListItem key={session.topic} sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
            <ListItemAvatar>
              <Avatar src={session.icon}>{session.name[0]}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={session.name} secondary={session.url} />
            <ListItemSecondaryAction>
              <IconButton edge="end" color="error" title="Disconnect">
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'List of active WalletConnect sessions.',
      },
    },
  },
}

// Connection State - Connected
export const ConnectionStateConnected: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Connected
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, my: 3 }}>
        <Avatar>S</Avatar>
        <LinkIcon color="success" />
        <Avatar>{mockSessions[0].name[0]}</Avatar>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Your Safe is now connected to {mockSessions[0].name}
      </Typography>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Connection success state showing Safe connected to dApp.',
      },
    },
  },
}

// Connection State - Disconnected
export const ConnectionStateDisconnected: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
      <LinkOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Disconnected
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {mockSessions[0].name} has been disconnected from your Safe.
      </Typography>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disconnection confirmation state.',
      },
    },
  },
}

// Empty Sessions
export const EmptySessions: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <MockWcLogoHeader />

      <TextField fullWidth placeholder="Paste pairing code or URI" sx={{ mb: 3 }} />

      <Button variant="contained" fullWidth disabled sx={{ mb: 3 }}>
        Connect
      </Button>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          No active sessions
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Connect to a dApp to get started
        </Typography>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WalletConnect UI with no active sessions.',
      },
    },
  },
}

// Error State
export const ErrorState: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <MockWcLogoHeader error="Connection failed" />

      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to connect: Invalid pairing URI
      </Alert>

      <TextField fullWidth placeholder="Paste pairing code or URI" error defaultValue="invalid-uri" sx={{ mb: 2 }} />

      <Button variant="contained" fullWidth>
        Try again
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state when connection fails.',
      },
    },
  },
}

// High Risk Proposal
export const HighRiskProposal: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 450 }}>
      <Typography variant="h6" gutterBottom>
        Connection request
      </Typography>

      <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold">
          Proceed with caution
        </Typography>
        <Typography variant="body2">This dApp is not verified and may be malicious.</Typography>
      </Alert>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'warning.main' }}>?</Avatar>
        <Box>
          <Typography variant="body1" fontWeight="bold">
            Unknown dApp
          </Typography>
          <Typography variant="caption" color="text.secondary">
            https://suspicious-site.com
          </Typography>
        </Box>
      </Box>

      <FormControlLabel
        control={<Checkbox />}
        label="I understand this dApp is not verified and accept the risks"
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" color="error" fullWidth>
          Reject
        </Button>
        <Button variant="outlined" fullWidth disabled>
          Approve
        </Button>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'High-risk dApp proposal with warnings.',
      },
    },
  },
}

// Help Hints
export const HelpHints: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">How to connect to a dApp</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">
            1. Open a WalletConnect-compatible dApp
            <br />
            2. Click &quot;Connect Wallet&quot; and select WalletConnect
            <br />
            3. Copy the pairing code and paste it above
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">What is WalletConnect?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">
            WalletConnect is an open protocol that allows you to connect your Safe to decentralized applications (dApps)
            securely.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">Is it safe?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">
            Always verify the dApp URL before approving a connection. Only connect to trusted applications.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Help accordion with usage instructions.',
      },
    },
  },
}
