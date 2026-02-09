import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Card,
  Divider,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

/**
 * Transaction Flow (tx-flow) components orchestrate multi-step transaction
 * creation, signing, and execution. This is the core transaction UI.
 *
 * The flow includes:
 * - Step-based navigation (form → review → sign/execute → confirmation)
 * - Transaction data display and validation
 * - Signing and execution actions
 *
 * Note: Actual TxFlow requires complex context providers.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Components/TxFlow',
  parameters: {
    layout: 'padded',
  },
}

export default meta

// Mock transaction data
const mockRecipient = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const mockAmount = '1.5'
const mockToken = 'ETH'

// Mock TxLayout - Main layout wrapper
const MockTxLayout = ({
  title,
  subtitle,
  icon,
  step = 0,
  totalSteps = 3,
  children,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  step?: number
  totalSteps?: number
  children: React.ReactNode
}) => (
  <Box sx={{ display: 'flex', gap: 3, maxWidth: 900 }}>
    {/* Sidebar */}
    <Paper sx={{ width: 280, p: 2, flexShrink: 0 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Safe Account
      </Typography>
      <Typography variant="body2" fontFamily="monospace" sx={{ mb: 2 }}>
        0x1234...5678
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Network
      </Typography>
      <Chip label="Ethereum" size="small" />
    </Paper>

    {/* Main content */}
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {icon}
        <Box>
          <Typography variant="h5">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {totalSteps > 1 && (
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <Step key={i}>
              <StepLabel>{['Create', 'Review', 'Execute'][i] || `Step ${i + 1}`}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {children}
    </Box>
  </Box>
)

// Mock TxCard - Form container
const MockTxCard = ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) => (
  <Card sx={{ p: 3 }}>
    {children}
    {actions && (
      <>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>{actions}</Box>
      </>
    )}
  </Card>
)

// Docs-style wrapper for each step
const StepWrapper = ({
  stepNumber,
  stepName,
  description,
  children,
}: {
  stepNumber: number
  stepName: string
  description: string
  children: React.ReactNode
}) => (
  <Box sx={{ mb: 8 }}>
    <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="overline" color="text.secondary">
        Step {stepNumber}
      </Typography>
      <Typography variant="h5">{stepName}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>{children}</Box>
  </Box>
)

// All Steps - Scrollable view of entire Token Transfer flow with full UI at each step
export const TokenTransferAllSteps: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 950 }}>
      <Box sx={{ mb: 6, pb: 3, borderBottom: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h4">Token Transfer Flow</Typography>
        <Typography variant="body1" color="text.secondary">
          Complete walkthrough of the token transfer process. Scroll to view each step.
        </Typography>
      </Box>

      {/* Step 1: Create */}
      <StepWrapper
        stepNumber={1}
        stepName="Create Transaction"
        description="User enters recipient address and amount to send."
      >
        <MockTxLayout
          title="Send tokens"
          subtitle="Transfer tokens from your Safe"
          icon={<SendIcon color="primary" />}
          step={0}
          totalSteps={3}
        >
          <MockTxCard actions={<Button variant="contained">Next</Button>}>
            <Typography variant="subtitle2" gutterBottom>
              Recipient
            </Typography>
            <TextField fullWidth placeholder="0x..." defaultValue={mockRecipient} sx={{ mb: 3 }} />

            <Typography variant="subtitle2" gutterBottom>
              Amount
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField placeholder="0.0" defaultValue={mockAmount} sx={{ flex: 1 }} />
              <TextField select defaultValue="ETH" sx={{ width: 120 }} SelectProps={{ native: true }}>
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="DAI">DAI</option>
              </TextField>
            </Box>
            <Alert severity="info">Available balance: 10.5 ETH</Alert>
          </MockTxCard>
        </MockTxLayout>
      </StepWrapper>

      {/* Step 2: Review */}
      <StepWrapper
        stepNumber={2}
        stepName="Review Transaction"
        description="User reviews transaction details, balance changes, and gas fees before signing."
      >
        <MockTxLayout
          title="Send tokens"
          subtitle="Transfer tokens from your Safe"
          icon={<SendIcon color="primary" />}
          step={1}
          totalSteps={3}
        >
          <MockTxCard
            actions={
              <>
                <Button>Back</Button>
                <Button variant="contained">Submit</Button>
              </>
            }
          >
            <Typography variant="h6" gutterBottom>
              Review Transaction
            </Typography>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Send
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {mockAmount} {mockToken}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  To
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {mockRecipient.slice(0, 10)}...{mockRecipient.slice(-8)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Network fee
                </Typography>
                <Typography variant="body2">~0.002 ETH</Typography>
              </Box>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Balance Changes
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  p: 1.5,
                  bgcolor: 'error.light',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">ETH</Typography>
                <Typography variant="body2" color="error.main" fontWeight="bold">
                  -{mockAmount} ETH
                </Typography>
              </Box>
            </Box>

            <Alert severity="info">This transaction requires 2 of 3 signatures to execute.</Alert>
          </MockTxCard>
        </MockTxLayout>
      </StepWrapper>

      {/* Step 3: Sign & Execute */}
      <StepWrapper
        stepNumber={3}
        stepName="Sign & Execute"
        description="User signs the transaction. Once threshold is reached, transaction can be executed."
      >
        <MockTxLayout
          title="Send tokens"
          subtitle="Transfer tokens from your Safe"
          icon={<SendIcon color="primary" />}
          step={2}
          totalSteps={3}
        >
          <MockTxCard>
            <Typography variant="h6" gutterBottom>
              Sign & Execute
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign with your connected wallet to add your confirmation.
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Confirmations: 1 of 2 required
              </Typography>
              <LinearProgress variant="determinate" value={50} sx={{ mt: 1 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" fullWidth>
                Sign transaction
              </Button>
              <Button variant="contained" color="success" fullWidth disabled>
                Execute
              </Button>
            </Box>
          </MockTxCard>
        </MockTxLayout>
      </StepWrapper>

      {/* Step 4: Success */}
      <StepWrapper
        stepNumber={4}
        stepName="Transaction Submitted"
        description="Confirmation screen shown after transaction is submitted to the network."
      >
        <MockTxLayout
          title="Send tokens"
          subtitle="Transfer tokens from your Safe"
          icon={<SendIcon color="primary" />}
          step={2}
          totalSteps={3}
        >
          <MockTxCard>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Transaction Submitted
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your transaction has been submitted and is awaiting confirmations.
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2, display: 'inline-block' }}>
                <Typography variant="caption" color="text.secondary">
                  Transaction hash
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  0xabc123...def456
                </Typography>
              </Box>
              <Box>
                <Button variant="outlined" size="small">
                  View on Etherscan
                </Button>
              </Box>
            </Box>
          </MockTxCard>
        </MockTxLayout>
      </StepWrapper>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All steps of the Token Transfer flow displayed vertically with full UI state at each step.',
      },
    },
  },
}

// Interactive version - Token Transfer Flow
export const TokenTransferInteractive: StoryObj = {
  tags: ['!chromatic'],
  render: () => {
    const [step, setStep] = useState(0)

    return (
      <MockTxLayout
        title="Send tokens"
        subtitle="Transfer tokens from your Safe"
        icon={<SendIcon color="primary" />}
        step={step}
        totalSteps={3}
      >
        {step === 0 && (
          <MockTxCard
            actions={
              <Button variant="contained" onClick={() => setStep(1)}>
                Next
              </Button>
            }
          >
            <Typography variant="subtitle2" gutterBottom>
              Recipient
            </Typography>
            <TextField fullWidth placeholder="0x..." defaultValue={mockRecipient} sx={{ mb: 3 }} />

            <Typography variant="subtitle2" gutterBottom>
              Amount
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField placeholder="0.0" defaultValue={mockAmount} sx={{ flex: 1 }} />
              <TextField select defaultValue="ETH" sx={{ width: 120 }} SelectProps={{ native: true }}>
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="DAI">DAI</option>
              </TextField>
            </Box>
          </MockTxCard>
        )}

        {step === 1 && (
          <MockTxCard
            actions={
              <>
                <Button onClick={() => setStep(0)}>Back</Button>
                <Button variant="contained" onClick={() => setStep(2)}>
                  Submit
                </Button>
              </>
            }
          >
            <Typography variant="h6" gutterBottom>
              Review Transaction
            </Typography>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Send
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {mockAmount} {mockToken}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  To
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {mockRecipient.slice(0, 10)}...{mockRecipient.slice(-8)}
                </Typography>
              </Box>
            </Box>
            <Alert severity="info">This transaction requires 2 of 3 signatures to execute.</Alert>
          </MockTxCard>
        )}

        {step === 2 && (
          <MockTxCard>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Transaction Submitted
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your transaction has been submitted and is awaiting confirmations.
              </Typography>
            </Box>
          </MockTxCard>
        )}
      </MockTxLayout>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive token transfer flow - click through to see each step.',
      },
    },
  },
}

// TxLayout variations
export const TxLayoutDefault: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout title="New Transaction" subtitle="Create a new transaction">
      <MockTxCard>
        <Typography variant="body2" color="text.secondary">
          Transaction form content goes here...
        </Typography>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default TxLayout with sidebar showing safe info and main content area.',
      },
    },
  },
}

export const TxLayoutWithProgress: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout title="Multi-step Transaction" step={1} totalSteps={4}>
      <MockTxCard>
        <Typography variant="body2" color="text.secondary">
          Step 2 of 4
        </Typography>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TxLayout with step progress indicator.',
      },
    },
  },
}

// TxCard variations
export const TxCardBasic: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Paper sx={{ maxWidth: 500, p: 2 }}>
      <MockTxCard>
        <Typography variant="body1">Basic card content</Typography>
      </MockTxCard>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic TxCard container for form content.',
      },
    },
  },
}

export const TxCardWithActions: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Paper sx={{ maxWidth: 500, p: 2 }}>
      <MockTxCard
        actions={
          <>
            <Button>Cancel</Button>
            <Button variant="contained">Continue</Button>
          </>
        }
      >
        <Typography variant="body1">Card with action buttons</Typography>
      </MockTxCard>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TxCard with action buttons footer.',
      },
    },
  },
}

// Sign Message Flow
export const SignMessageFlow: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout title="Sign Message" subtitle="Sign an off-chain message" icon={<EditIcon color="primary" />}>
      <MockTxCard
        actions={
          <>
            <Button>Reject</Button>
            <Button variant="contained">Sign</Button>
          </>
        }
      >
        <Typography variant="subtitle2" gutterBottom>
          Message to sign
        </Typography>
        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" fontFamily="monospace">
            Hello, this is a test message to be signed by the Safe.
          </Typography>
        </Box>
        <Alert severity="info">This is an off-chain signature. No transaction will be executed on-chain.</Alert>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sign message flow for off-chain signatures.',
      },
    },
  },
}

// Swap Flow
export const SwapFlow: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout
      title="Swap tokens"
      subtitle="Exchange one token for another"
      icon={<SwapHorizIcon color="primary" />}
    >
      <MockTxCard
        actions={
          <>
            <Button>Cancel</Button>
            <Button variant="contained">Review swap</Button>
          </>
        }
      >
        <Typography variant="subtitle2" gutterBottom>
          You sell
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField placeholder="0.0" defaultValue="1.0" sx={{ flex: 1 }} />
          <Chip label="ETH" />
        </Box>

        <Box sx={{ textAlign: 'center', my: 2 }}>
          <SwapHorizIcon sx={{ transform: 'rotate(90deg)' }} />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          You receive
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField placeholder="0.0" defaultValue="1850.00" disabled sx={{ flex: 1 }} />
          <Chip label="USDC" />
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Rate: 1 ETH = 1,850 USDC
          </Typography>
        </Box>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Token swap transaction flow.',
      },
    },
  },
}

// Loading state
export const LoadingState: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <MockTxLayout title="Processing Transaction">
      <MockTxCard>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LinearProgress sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Submitting transaction...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please confirm in your wallet
          </Typography>
        </Box>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transaction submission in progress.',
      },
    },
  },
}

// Error state
export const ErrorState: StoryObj = {
  render: () => (
    <MockTxLayout title="Send tokens" icon={<SendIcon color="primary" />}>
      <MockTxCard
        actions={
          <>
            <Button>Cancel</Button>
            <Button variant="contained">Try again</Button>
          </>
        }
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Transaction failed: Insufficient funds for gas
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Your Safe does not have enough ETH to pay for the transaction gas fees.
        </Typography>
      </MockTxCard>
    </MockTxLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state when transaction fails.',
      },
    },
  },
}

// Review with balance changes
export const ReviewWithBalanceChanges: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Paper sx={{ maxWidth: 500, p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Balance Changes
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 2,
            bgcolor: 'error.light',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2">ETH</Typography>
          <Typography variant="body2" color="error.main" fontWeight="bold">
            -1.5 ETH
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 2,
            bgcolor: 'success.light',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2">USDC</Typography>
          <Typography variant="body2" color="success.main" fontWeight="bold">
            +2,775 USDC
          </Typography>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Balance changes display in transaction review.',
      },
    },
  },
}

// Action buttons
export const ActionButtons: StoryObj = {
  tags: ['!chromatic'],
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="subtitle2" gutterBottom>
        Transaction Actions
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button variant="contained" fullWidth>
          Sign transaction
        </Button>
        <Button variant="contained" color="success" fullWidth>
          Execute transaction
        </Button>
        <Button variant="outlined" color="error" fullWidth>
          Reject transaction
        </Button>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available action buttons for transaction flows.',
      },
    },
  },
}
