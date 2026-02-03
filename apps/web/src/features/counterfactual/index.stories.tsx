import type { Meta, StoryObj } from '@storybook/react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

/**
 * Counterfactual feature handles undeployed (counterfactual) Safe accounts.
 * These Safes exist as addresses but are not yet deployed on-chain.
 *
 * Key components:
 * - CheckBalance: Alert when Safe needs activation
 * - ActivateAccountFlow: Deployment flow
 * - CounterfactualSuccessScreen: Deployment success dialog
 *
 * Note: Actual components require Redux store and wallet context.
 * These stories document the UI patterns.
 */
const meta: Meta = {
  title: 'Features/Counterfactual',
  parameters: {
    layout: 'centered',
    chromatic: { disableSnapshot: true },
  },
}

export default meta

// Mock safe info
const mockSafeAddress = '0x1234567890123456789012345678901234567890'
const mockChain = { name: 'Ethereum', chainId: '1', explorerUrl: 'https://etherscan.io' }

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
    <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', justifyContent: 'center' }}>{children}</Box>
  </Box>
)

// All States - Scrollable view of entire Counterfactual activation flow
export const ActivationAllStates: StoryObj = {
  render: () => (
    <Box sx={{ maxWidth: 600 }}>
      <Box sx={{ mb: 6, pb: 3, borderBottom: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h4">Safe Activation Flow</Typography>
        <Typography variant="body1" color="text.secondary">
          Complete walkthrough of activating a counterfactual (undeployed) Safe. Scroll to view each state.
        </Typography>
      </Box>

      {/* State 1: Not Deployed Alert */}
      <StateWrapper
        stateName="Not Deployed Alert"
        description="Banner shown on dashboard when Safe is not yet deployed on-chain."
      >
        <Alert
          severity="info"
          sx={{ maxWidth: 500 }}
          action={
            <Button color="inherit" size="small" startIcon={<RocketLaunchIcon />}>
              Activate
            </Button>
          }
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Safe not yet activated
          </Typography>
          <Typography variant="body2">
            Your Safe needs to be activated before you can make transactions. You can receive funds to this address now.
          </Typography>
        </Alert>
      </StateWrapper>

      {/* State 2: Activation Options */}
      <StateWrapper
        stateName="Activation Options"
        description="User chooses between paying now or paying later (with first transaction)."
      >
        <Paper sx={{ p: 3, maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            Choose activation method
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select how you want to pay for Safe deployment
          </Typography>

          <Box
            sx={{
              p: 2,
              border: 2,
              borderColor: 'primary.main',
              borderRadius: 1,
              mb: 2,
              cursor: 'pointer',
            }}
          >
            <Typography variant="subtitle2">Pay now</Typography>
            <Typography variant="body2" color="text.secondary">
              Deploy your Safe immediately by paying gas fees
            </Typography>
            <Typography variant="caption" color="primary">
              ~0.005 ETH
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              cursor: 'pointer',
            }}
          >
            <Typography variant="subtitle2">Pay later</Typography>
            <Typography variant="body2" color="text.secondary">
              Activate when you make your first transaction
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Deployment cost added to first transaction
            </Typography>
          </Box>
        </Paper>
      </StateWrapper>

      {/* State 3: Activation Form */}
      <StateWrapper
        stateName="Activation Form"
        description="User reviews Safe details and estimated fees before activating."
      >
        <Paper sx={{ p: 3, maxWidth: 500 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <RocketLaunchIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6">Activate your Safe</Typography>
              <Typography variant="body2" color="text.secondary">
                Deploy your Safe to start using it
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Your Safe exists as an address but is not yet deployed on-chain. Activate it to start making transactions.
          </Alert>

          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Safe address
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              {mockSafeAddress}
            </Typography>
          </Box>

          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Network
            </Typography>
            <Chip label={mockChain.name} size="small" />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Estimated network fee</Typography>
            <Typography variant="body2" fontWeight="bold">
              ~0.005 ETH
            </Typography>
          </Box>

          <Button variant="contained" fullWidth size="large">
            Activate Safe
          </Button>
        </Paper>
      </StateWrapper>

      {/* State 4: Insufficient Balance */}
      <StateWrapper
        stateName="Insufficient Balance"
        description="Activation blocked when user doesn't have enough funds for gas."
      >
        <Paper sx={{ p: 3, maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            Activate your Safe
          </Typography>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Insufficient balance
            </Typography>
            <Typography variant="body2">
              You need at least 0.005 ETH to activate your Safe. Current balance: 0.001 ETH
            </Typography>
          </Alert>

          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Required
              </Typography>
              <Typography variant="body2">~0.005 ETH</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Current balance
              </Typography>
              <Typography variant="body2" color="error.main">
                0.001 ETH
              </Typography>
            </Box>
          </Box>

          <Button variant="contained" fullWidth disabled>
            Activate Safe
          </Button>
        </Paper>
      </StateWrapper>

      {/* State 5: Activating */}
      <StateWrapper stateName="Activating" description="Loading state while Safe deployment is in progress.">
        <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
          <RocketLaunchIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Activating Safe...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please wait while your Safe is being deployed
          </Typography>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary">
            This may take up to a minute
          </Typography>
        </Paper>
      </StateWrapper>

      {/* State 6: Success */}
      <StateWrapper stateName="Activation Success" description="Confirmation dialog shown after Safe is deployed.">
        <Dialog open maxWidth="sm" fullWidth>
          <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5">Safe activated!</Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your Safe has been successfully deployed and is ready to use.
            </Typography>

            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Safe address
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                {mockSafeAddress}
              </Typography>
            </Box>

            <Button
              variant="text"
              size="small"
              endIcon={<OpenInNewIcon />}
              href={`${mockChain.explorerUrl}/address/${mockSafeAddress}`}
            >
              View on Etherscan
            </Button>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button variant="contained" startIcon={<AccountBalanceWalletIcon />}>
              Open Safe
            </Button>
          </DialogActions>
        </Dialog>
      </StateWrapper>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All states of the Safe activation flow displayed vertically for easy review.',
      },
    },
  },
}

// Individual state: Activate Account Flow
export const FullActivateAccountFlow: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <RocketLaunchIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6">Activate your Safe</Typography>
          <Typography variant="body2" color="text.secondary">
            Deploy your Safe to start using it
          </Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Your Safe exists as an address but is not yet deployed on-chain. Activate it to start making transactions.
      </Alert>

      <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Safe address
        </Typography>
        <Typography variant="body2" fontFamily="monospace">
          {mockSafeAddress}
        </Typography>
      </Box>

      <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Network
        </Typography>
        <Chip label={mockChain.name} size="small" />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Estimated network fee</Typography>
        <Typography variant="body2" fontWeight="bold">
          ~0.005 ETH
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2">Estimated time</Typography>
        <Typography variant="body2">~30 seconds</Typography>
      </Box>

      <Button variant="contained" fullWidth size="large">
        Activate Safe
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full activation flow for deploying a counterfactual Safe.',
      },
    },
  },
}

// Check Balance Alert
export const CheckBalanceAlert: StoryObj = {
  render: () => (
    <Alert
      severity="info"
      sx={{ maxWidth: 500 }}
      action={
        <Button color="inherit" size="small" startIcon={<RocketLaunchIcon />}>
          Activate
        </Button>
      }
    >
      <Typography variant="body2" fontWeight="bold" gutterBottom>
        Safe not yet activated
      </Typography>
      <Typography variant="body2">
        Your Safe needs to be activated before you can make transactions. You can receive funds to this address now.
      </Typography>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alert shown when Safe is not deployed but can receive funds.',
      },
    },
  },
}

// Activation Success
export const ActivationSuccess: StoryObj = {
  render: () => (
    <Dialog open maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h5">Safe activated!</Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your Safe has been successfully deployed and is ready to use.
        </Typography>

        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Safe address
          </Typography>
          <Typography variant="body2" fontFamily="monospace">
            {mockSafeAddress}
          </Typography>
        </Box>

        <Button
          variant="text"
          size="small"
          endIcon={<OpenInNewIcon />}
          href={`${mockChain.explorerUrl}/address/${mockSafeAddress}`}
        >
          View on Etherscan
        </Button>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button variant="contained" startIcon={<AccountBalanceWalletIcon />}>
          Open Safe
        </Button>
      </DialogActions>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success dialog shown after Safe deployment.',
      },
    },
  },
}

// Activation In Progress
export const ActivationInProgress: StoryObj = {
  render: () => (
    <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
      <RocketLaunchIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Activating Safe...
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please wait while your Safe is being deployed
      </Typography>
      <LinearProgress sx={{ mb: 2 }} />
      <Typography variant="caption" color="text.secondary">
        This may take up to a minute
      </Typography>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state during Safe deployment.',
      },
    },
  },
}

// Activation Button
export const ActivateAccountButton: StoryObj = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300 }}>
      <Button variant="contained" startIcon={<RocketLaunchIcon />} fullWidth>
        Activate Safe
      </Button>
      <Button variant="outlined" startIcon={<RocketLaunchIcon />} fullWidth>
        Activate Safe
      </Button>
      <Button variant="text" startIcon={<RocketLaunchIcon />}>
        Activate Safe
      </Button>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Activation button variants.',
      },
    },
  },
}

// Not Deployed Chip
export const NotDeployedChip: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="subtitle2" gutterBottom>
        Safe Status Indicators
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2">Counterfactual Safe</Typography>
          <Chip label="Not deployed" size="small" color="info" variant="outlined" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2">Deployed Safe</Typography>
          <Chip label="Active" size="small" color="success" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2">Deploying</Typography>
          <Chip label="Pending" size="small" color="warning" />
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Status chips for counterfactual Safe states.',
      },
    },
  },
}

// Insufficient Balance
export const InsufficientBalance: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Activate your Safe
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Insufficient balance
        </Typography>
        <Typography variant="body2">
          You need at least 0.005 ETH to activate your Safe. Current balance: 0.001 ETH
        </Typography>
      </Alert>

      <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Required
          </Typography>
          <Typography variant="body2">~0.005 ETH</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Current balance
          </Typography>
          <Typography variant="body2" color="error.main">
            0.001 ETH
          </Typography>
        </Box>
      </Box>

      <Button variant="contained" fullWidth disabled>
        Activate Safe
      </Button>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Activation blocked due to insufficient balance.',
      },
    },
  },
}

// Pay Now Pay Later Options
export const PayNowPayLater: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        Choose activation method
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select how you want to pay for Safe deployment
      </Typography>

      <Box
        sx={{
          p: 2,
          border: 2,
          borderColor: 'primary.main',
          borderRadius: 1,
          mb: 2,
          cursor: 'pointer',
        }}
      >
        <Typography variant="subtitle2">Pay now</Typography>
        <Typography variant="body2" color="text.secondary">
          Deploy your Safe immediately by paying gas fees
        </Typography>
        <Typography variant="caption" color="primary">
          ~0.005 ETH
        </Typography>
      </Box>

      <Box
        sx={{
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          cursor: 'pointer',
        }}
      >
        <Typography variant="subtitle2">Pay later</Typography>
        <Typography variant="body2" color="text.secondary">
          Activate when you make your first transaction
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Deployment cost added to first transaction
        </Typography>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Options for paying activation fees now or later.',
      },
    },
  },
}

// First Transaction Flow
export const FirstTransactionFlow: StoryObj = {
  render: () => (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          First transaction will activate your Safe
        </Typography>
        <Typography variant="body2">
          Your Safe will be deployed as part of this transaction. Deployment cost will be added to the gas fee.
        </Typography>
      </Alert>

      <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Transaction fee
          </Typography>
          <Typography variant="body2">~0.002 ETH</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Deployment fee
          </Typography>
          <Typography variant="body2">~0.005 ETH</Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" fontWeight="bold">
            Total
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            ~0.007 ETH
          </Typography>
        </Box>
      </Box>
    </Paper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Information shown when first transaction includes deployment.',
      },
    },
  },
}

// Receive Funds Info
export const ReceiveFundsInfo: StoryObj = {
  render: () => (
    <Alert severity="success" sx={{ maxWidth: 500 }}>
      <Typography variant="body2" fontWeight="bold" gutterBottom>
        Ready to receive funds
      </Typography>
      <Typography variant="body2">
        Even though your Safe is not deployed yet, you can already receive funds to this address. The Safe will be
        activated when you make your first transaction.
      </Typography>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Info about receiving funds to counterfactual Safe.',
      },
    },
  },
}
