import type { Meta, StoryObj } from '@storybook/react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SecurityIcon from '@mui/icons-material/Security'

/**
 * Recovery feature allows Safe owners to set up account recovery mechanisms.
 * Recoverers can initiate recovery transactions after a delay period.
 *
 * Key components:
 * - RecoverySettings: Configure recovery parameters
 * - RecoveryList: View pending recovery transactions
 * - RecoveryStatus: Display recovery transaction status
 *
 * Note: Actual components require Redux store and wallet context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/Recovery',
  parameters: {
    layout: 'padded',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Mock recovery data
const mockRecoverers = [
  { address: '0x1234567890123456789012345678901234567890', name: 'Recovery Wallet 1' },
  { address: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01', name: 'Recovery Wallet 2' },
]

const mockRecoveryQueue = [
  {
    id: '1',
    type: 'Account Recovery',
    status: 'pending',
    validFrom: Date.now() + 86400000 * 2, // 2 days from now
    expiresAt: Date.now() + 86400000 * 7, // 7 days from now
    executor: '0x1234567890123456789012345678901234567890',
    isMalicious: false,
  },
  {
    id: '2',
    type: 'Malicious Transaction',
    status: 'expired',
    validFrom: Date.now() - 86400000 * 5,
    expiresAt: Date.now() - 86400000 * 1,
    executor: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
    isMalicious: true,
  },
]

// Mock RecoveryType component
const MockRecoveryType = ({ isMalicious }: { isMalicious: boolean }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {isMalicious ? <WarningIcon color="error" fontSize="small" /> : <SecurityIcon color="primary" fontSize="small" />}
    <Typography variant="body2">{isMalicious ? 'Malicious Transaction' : 'Account Recovery'}</Typography>
  </Box>
)

// Mock RecoveryStatus component
const MockRecoveryStatus = ({ status }: { status: 'pending' | 'processing' | 'ready' | 'expired' }) => {
  const statusConfig = {
    pending: { label: 'Pending', color: 'warning' as const },
    processing: { label: 'Processing', color: 'info' as const },
    ready: { label: 'Ready to execute', color: 'success' as const },
    expired: { label: 'Expired', color: 'error' as const },
  }
  const config = statusConfig[status]
  return <Chip label={config.label} color={config.color} size="small" />
}

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

// All States - Scrollable view of all Recovery states
export const RecoveryAllStates: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 900 }}>
      <Box sx={{ mb: 6, pb: 3, borderBottom: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h4">Recovery Feature States</Typography>
        <Typography variant="body1" color="text.secondary">
          All possible states of the account recovery feature. Scroll to view each state.
        </Typography>
      </Box>

      {/* State 1: No Recovery Configured */}
      <StateWrapper
        stateName="No Recovery Configured"
        description="Initial state when no recovery mechanism is set up for the Safe."
      >
        <Box sx={{ maxWidth: 700 }}>
          <Typography variant="h4" gutterBottom>
            Account Recovery
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              No recovery setup
            </Typography>
            <Typography variant="body2">
              Set up account recovery to allow trusted addresses to recover your Safe if you lose access.
            </Typography>
          </Alert>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <SecurityIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Set up account recovery</Typography>
                <Typography variant="body2" color="text.secondary">
                  Add trusted addresses that can help recover your Safe
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">Recoverers can initiate account recovery after a delay</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">Owners can cancel malicious recovery attempts</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="body2">Configurable delay period for added security</Typography>
              </Box>
            </Box>

            <Button variant="contained">Set up recovery</Button>
          </Paper>
        </Box>
      </StateWrapper>

      {/* State 2: Recovery Configured */}
      <StateWrapper
        stateName="Recovery Configured"
        description="Recovery is set up with trusted recoverers and delay period."
      >
        <Box sx={{ maxWidth: 700 }}>
          <Typography variant="h4" gutterBottom>
            Account Recovery
          </Typography>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recovery Settings
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Delay period
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                7 days
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Expiration period
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                14 days
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Recoverers
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockRecoverers.map((recoverer) => (
                    <TableRow key={recoverer.address}>
                      <TableCell>{recoverer.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {recoverer.address.slice(0, 10)}...{recoverer.address.slice(-8)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Button variant="outlined">Edit recovery settings</Button>
        </Box>
      </StateWrapper>

      {/* State 3: Recovery In Progress */}
      <StateWrapper
        stateName="Recovery In Progress"
        description="A recovery transaction has been initiated and is waiting for the delay period."
      >
        <Box sx={{ maxWidth: 700 }}>
          <Typography variant="h4" gutterBottom>
            Account Recovery
          </Typography>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              Recovery in progress
            </Typography>
            <Typography variant="body2">
              A recovery transaction has been initiated. If this was not you, cancel it immediately.
            </Typography>
          </Alert>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pending Recovery
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <AccessTimeIcon color="warning" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Can be executed in
                </Typography>
                <Typography variant="h6">2 days, 4 hours</Typography>
              </Box>
            </Box>

            <LinearProgress variant="determinate" value={30} sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="error">
                Cancel recovery
              </Button>
              <Button variant="outlined">View details</Button>
            </Box>
          </Paper>
        </Box>
      </StateWrapper>

      {/* State 4: Recovery Queue */}
      <StateWrapper stateName="Recovery Queue" description="List of all recovery transactions with their statuses.">
        <Box sx={{ maxWidth: 700 }}>
          <Typography variant="h6" gutterBottom>
            Recovery Queue
          </Typography>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <MockRecoveryType isMalicious={false} />
                <Box sx={{ flex: 1 }} />
                <MockRecoveryStatus status="pending" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Initiated by
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    0x1234...5678
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Valid from
                  </Typography>
                  <Typography variant="body2">In 2 days</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Expires
                  </Typography>
                  <Typography variant="body2">In 7 days</Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </StateWrapper>

      {/* State 5: Status Variants */}
      <StateWrapper stateName="Status Variants" description="All possible status indicators for recovery transactions.">
        <Paper sx={{ p: 3, maxWidth: 400 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recovery Status Indicators
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">Waiting for delay period</Typography>
              <MockRecoveryStatus status="pending" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">Being processed</Typography>
              <MockRecoveryStatus status="processing" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">Can be executed</Typography>
              <MockRecoveryStatus status="ready" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">Expired</Typography>
              <MockRecoveryStatus status="expired" />
            </Box>
          </Box>
        </Paper>
      </StateWrapper>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All states of the Recovery feature displayed vertically for easy review.',
      },
    },
  },
}

// Individual state: Full Recovery Settings Page
export const FullRecoveryPage: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h4" gutterBottom>
        Account Recovery
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set up recovery options to regain access to your Safe if you lose your owner keys.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recovery Settings
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Recoverer</TableCell>
                <TableCell>Address</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockRecoverers.map((recoverer) => (
                <TableRow key={recoverer.address}>
                  <TableCell>{recoverer.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {recoverer.address.slice(0, 10)}...{recoverer.address.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error">
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Recovery delay: <strong>2 days</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Expiry period: <strong>7 days</strong>
          </Typography>
        </Box>

        <Button variant="contained" sx={{ mt: 2 }}>
          Add Recoverer
        </Button>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recovery Queue
        </Typography>
        {mockRecoveryQueue.map((item) => (
          <Accordion key={item.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <MockRecoveryType isMalicious={item.isMalicious} />
                <Box sx={{ flex: 1 }} />
                <MockRecoveryStatus status={item.status as 'pending' | 'expired'} />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Executor: {item.executor.slice(0, 10)}...{item.executor.slice(-8)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Valid from: {new Date(item.validFrom).toLocaleDateString()}
              </Typography>
              {!item.isMalicious && item.status === 'pending' && (
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" size="small" sx={{ mr: 1 }}>
                    Execute
                  </Button>
                  <Button variant="outlined" color="error" size="small">
                    Cancel
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full recovery settings page with recoverers list and recovery queue.',
      },
    },
  },
}

// Recovery not configured
export const NoRecoveryConfigured: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
      <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Recovery not set up
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Account recovery allows you to regain access to your Safe if you lose your owner keys. Set up recovery to
        protect your assets.
      </Typography>
      <Button variant="contained">Set up recovery</Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state when recovery is not configured.',
      },
    },
  },
}

// Active recovery in progress
export const RecoveryInProgress: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight="bold">
          Recovery in progress
        </Typography>
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Time remaining</Typography>
          <Typography variant="body2" fontWeight="bold">
            1 day 14 hours
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={30} sx={{ height: 8, borderRadius: 1 }} />
      </Box>

      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Initiated by
        </Typography>
        <Typography variant="body2" fontFamily="monospace">
          0x1234...5678
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        If you did not initiate this recovery, cancel it immediately to protect your Safe.
      </Typography>

      <Button variant="contained" color="error" fullWidth>
        Cancel Recovery
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Recovery transaction in progress with countdown.',
      },
    },
  },
}

// Recovery status chips
export const RecoveryStatusVariants: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="subtitle2" gutterBottom>
        Recovery Status Variants
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Pending (delay period)</Typography>
          <MockRecoveryStatus status="pending" />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Processing</Typography>
          <MockRecoveryStatus status="processing" />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Ready to execute</Typography>
          <MockRecoveryStatus status="ready" />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Expired</Typography>
          <MockRecoveryStatus status="expired" />
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different recovery status states.',
      },
    },
  },
}

// Recovery type indicators
export const RecoveryTypeIndicators: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="subtitle2" gutterBottom>
        Recovery Type Indicators
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <MockRecoveryType isMalicious={false} />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Legitimate recovery attempt by authorized recoverer
          </Typography>
        </Box>
        <Box sx={{ p: 2, border: 1, borderColor: 'error.main', borderRadius: 1, bgcolor: 'error.light' }}>
          <MockRecoveryType isMalicious={true} />
          <Typography variant="caption" color="error.main" display="block" sx={{ mt: 1 }}>
            Potentially malicious - review carefully before proceeding
          </Typography>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Recovery type indicators showing legitimate vs malicious attempts.',
      },
    },
  },
}

// Recovery list item
export const RecoveryListItem: StoryObj = {
  render: () => (
    <Paper sx={{ maxWidth: 600 }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <MockRecoveryType isMalicious={false} />
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="caption">2 days left</Typography>
            </Box>
            <MockRecoveryStatus status="pending" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Executor
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                0x1234567890123456789012345678901234567890
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Transaction Hash
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                0xabcd...ef01
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" size="small">
                Execute
              </Button>
              <Button variant="outlined" color="error" size="small">
                Cancel
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Individual recovery list item with expandable details.',
      },
    },
  },
}

// Recovery settings card
export const RecoverySettingsCard: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <CheckCircleIcon color="success" />
        <Typography variant="h6">Recovery Enabled</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Recoverers
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            2
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Delay period
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            2 days
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Expiry period
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            7 days
          </Typography>
        </Box>
      </Box>

      <Button variant="outlined" fullWidth sx={{ mt: 3 }}>
        Edit Recovery Settings
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Recovery settings summary card.',
      },
    },
  },
}
